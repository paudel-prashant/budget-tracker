import { unstable_cache } from "next/cache";
import { processRecurringTransactions } from "@/lib/domain/recurring-processor";
import { startOfUtcDay } from "@/lib/domain/recurrence-dates";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDefaultFinanceAccount,
  syncAllFinanceAccountBalances,
} from "@/lib/data/finance-account-data";
import { roundMoney } from "@/lib/forecasting/types";
import {
  buildHistoricalBalancePoints,
  calculateSpendingTrends,
  projectRecurringEvents,
  runForecastEngine,
  type ForecastEngineResult,
  type ForecastTimeframe,
} from "@/lib/forecasting";

const CACHE_SECONDS = 60;

async function loadForecastInput(userId: string, timeframe: ForecastTimeframe) {
  assertDatabaseUrl();
  await processRecurringTransactions(userId);

  const account = await ensureDefaultFinanceAccount(userId);
  // Cash flow is forecast across all spendable accounts: transfers between them cancel out,
  // so their combined balance plus every income/expense is the user's cash position.
  // Investment accounts (TFSA, RRSP) are wealth, not cash flow, so they're left out.
  const [balances, investmentAccounts] = await Promise.all([
    syncAllFinanceAccountBalances(userId),
    prisma.financeAccount.findMany({
      where: { userId, type: "INVESTMENT" },
      select: { id: true },
    }),
  ]);
  const investmentIds = investmentAccounts.map((row) => row.id);
  const combinedBalance = roundMoney(
    [...balances.entries()]
      .filter(([id]) => !investmentIds.includes(id))
      .reduce((sum, [, value]) => sum + value, 0)
  );
  const today = startOfUtcDay(new Date());
  const forecastDays =
    timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : 180;

  const through = new Date(today);
  through.setUTCDate(through.getUTCDate() + forecastDays);

  const [transactions, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where:
        investmentIds.length > 0
          ? {
              userId,
              OR: [{ financeAccountId: null }, { financeAccountId: { notIn: investmentIds } }],
            }
          : { userId },
      select: {
        date: true,
        amount: true,
        baseAmount: true,
        type: true,
        category: true,
        recurringTransactionId: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        category: true,
        frequency: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  const historicalPoints = buildHistoricalBalancePoints(
    transactions.map((tx) => ({
      date: tx.date,
      amount: tx.baseAmount ?? tx.amount,
      type: tx.type,
    })),
    Math.min(90, forecastDays + 30)
  );

  const recurringEvents = projectRecurringEvents(recurring, today, through);

  const trends = calculateSpendingTrends(
    transactions.map((tx) => ({
      date: tx.date,
      amount: tx.baseAmount ?? tx.amount,
      type: tx.type,
      category: tx.category,
      recurringTransactionId: tx.recurringTransactionId,
    })),
    recurringEvents
  );

  return runForecastEngine({
    timeframe,
    currentBalance: combinedBalance,
    currency: account.currency,
    historicalPoints,
    recurringEvents,
    trends,
    hasRecurring: recurring.length > 0,
    transactionCount: transactions.length,
  });
}

export async function getCashFlowForecast(
  userId: string,
  timeframe: ForecastTimeframe
): Promise<ForecastEngineResult> {
  const cached = unstable_cache(
    () => loadForecastInput(userId, timeframe),
    [`forecast-${userId}-${timeframe}`],
    { revalidate: CACHE_SECONDS, tags: [`forecast-${userId}`] }
  );

  return cached();
}

export function invalidateForecastCache(_userId: string) {
  // Tag-based revalidation is wired through revalidateFinancePages + revalidateTag when added.
}
