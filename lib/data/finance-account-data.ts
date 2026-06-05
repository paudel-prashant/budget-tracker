import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { roundMoney } from "@/lib/forecasting/types";

const DEFAULT_ACCOUNT_NAME = "Primary Account";

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
        currency: "USD",
        currentBalance: 0,
      },
    });
  }

  await backfillTransactionAccounts(userId, account.id);
  const balance = await syncFinanceAccountBalance(userId, account.id);

  return { ...account, currentBalance: balance };
}

async function backfillTransactionAccounts(userId: string, financeAccountId: string) {
  await prisma.transaction.updateMany({
    where: { userId, financeAccountId: null },
    data: { financeAccountId },
  });
}

export async function syncFinanceAccountBalance(userId: string, financeAccountId: string) {
  const [income, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, financeAccountId, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, financeAccountId, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const balance = roundMoney((income._sum.amount ?? 0) - (expenses._sum.amount ?? 0));

  await prisma.financeAccount.update({
    where: { id: financeAccountId },
    data: { currentBalance: balance },
  });

  return balance;
}

export async function syncFinanceAccountsForUser(userId: string) {
  const account = await ensureDefaultFinanceAccount(userId);
  return account;
}
