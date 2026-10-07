import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { roundMoney } from "@/lib/forecasting/types";
import { computeAccountBalance } from "@/lib/domain/account-balance";
import { summarizeCreditCards, type CreditCardSummary } from "@/lib/domain/account-net-worth";

const DEFAULT_ACCOUNT_NAME = "Primary Account";

/**
 * The user's primary account (their oldest), created on first use. Transactions that
 * don't name an account land here.
 */
export async function ensureDefaultFinanceAccount(userId: string) {
  assertDatabaseUrl();

  let account = await prisma.financeAccount.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!account) {
    account = await prisma.financeAccount.create({
      data: {
        userId,
        name: DEFAULT_ACCOUNT_NAME,
        type: "CHECKING",
        currency: "CAD",
        currentBalance: 0,
      },
    });
  }

  await backfillTransactionAccounts(userId, account.id);
  const balances = await syncAllFinanceAccountBalances(userId);

  return { ...account, currentBalance: balances.get(account.id) ?? account.currentBalance };
}

async function backfillTransactionAccounts(userId: string, financeAccountId: string) {
  await prisma.transaction.updateMany({
    where: { userId, financeAccountId: null },
    data: { financeAccountId },
  });
}

/**
 * Recomputes currentBalance for every account the user has:
 * opening balance + income − expenses + transfers in − transfers out.
 * Three grouped queries regardless of how many accounts there are.
 */
export async function syncAllFinanceAccountBalances(userId: string): Promise<Map<string, number>> {
  const [accounts, transactionTotals, transfersOut, transfersIn] = await Promise.all([
    prisma.financeAccount.findMany({
      where: { userId },
      select: { id: true, openingBalance: true, currentBalance: true },
    }),
    prisma.transaction.groupBy({
      by: ["financeAccountId", "type"],
      where: { userId, financeAccountId: { not: null } },
      _sum: { baseAmount: true },
    }),
    prisma.transfer.groupBy({
      by: ["fromAccountId"],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.transfer.groupBy({
      by: ["toAccountId"],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const balances = new Map<string, number>();

  await Promise.all(
    accounts.map(async (account) => {
      const sumFor = (type: "INCOME" | "EXPENSE") =>
        transactionTotals.find((row) => row.financeAccountId === account.id && row.type === type)
          ?._sum.baseAmount ?? 0;

      const balance = computeAccountBalance({
        openingBalance: account.openingBalance,
        income: sumFor("INCOME"),
        expenses: sumFor("EXPENSE"),
        transfersIn: transfersIn.find((row) => row.toAccountId === account.id)?._sum.amount ?? 0,
        transfersOut:
          transfersOut.find((row) => row.fromAccountId === account.id)?._sum.amount ?? 0,
      });

      balances.set(account.id, balance);

      if (roundMoney(account.currentBalance) !== balance) {
        await prisma.financeAccount.update({
          where: { id: account.id },
          data: { currentBalance: balance },
        });
      }
    })
  );

  return balances;
}

export async function syncFinanceAccountsForUser(userId: string) {
  const account = await ensureDefaultFinanceAccount(userId);
  return account;
}

/**
 * Resolves which account a transaction belongs to: the requested one if the user owns
 * it, otherwise null (caller responds 400). Undefined means "use the primary account".
 */
export async function resolveTransactionAccountId(
  userId: string,
  requestedId: string | undefined
): Promise<string | null> {
  if (requestedId === undefined) {
    const primary = await ensureDefaultFinanceAccount(userId);
    return primary.id;
  }

  const owned = await prisma.financeAccount.findFirst({
    where: { id: requestedId, userId },
    select: { id: true },
  });

  return owned?.id ?? null;
}

export async function listFinanceAccounts(userId: string) {
  const primary = await ensureDefaultFinanceAccount(userId);

  const [accounts, transactionCounts] = await Promise.all([
    prisma.financeAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["financeAccountId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    openingBalance: account.openingBalance,
    currentBalance: account.currentBalance,
    creditLimit: account.creditLimit,
    isPrimary: account.id === primary.id,
    transactionCount:
      transactionCounts.find((row) => row.financeAccountId === account.id)?._count._all ?? 0,
    createdAt: account.createdAt.toISOString(),
  }));
}

/** Credit card balances and utilization. Reads stored balances — sync first if stale. */
export async function getCreditCardSummary(userId: string): Promise<CreditCardSummary> {
  assertDatabaseUrl();

  const cards = await prisma.financeAccount.findMany({
    where: { userId, type: "CREDIT" },
    select: { id: true, name: true, currentBalance: true, creditLimit: true },
  });

  return summarizeCreditCards(cards);
}
