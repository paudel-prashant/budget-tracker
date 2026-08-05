import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";

/**
 * Every table that stores per-user financial data, bundled into one export.
 * Deliberately excludes Account/Session (OAuth tokens — not "your data" in the
 * export sense, and not something that should ever leave the server).
 */
export async function buildUserDataExport(userId: string) {
  assertDatabaseUrl();

  const [
    account,
    transactions,
    budgets,
    recurringTransactions,
    categoryMappings,
    assets,
    liabilities,
    netWorthSnapshots,
    financeAccounts,
    dashboardLayout,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, preferredCurrency: true },
    }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.budget.findMany({ where: { userId }, orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.recurringTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.categoryMapping.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { asOfDate: "desc" } }),
    prisma.liability.findMany({ where: { userId }, orderBy: { asOfDate: "desc" } }),
    prisma.netWorthSnapshot.findMany({ where: { userId }, orderBy: { month: "desc" } }),
    prisma.financeAccount.findMany({ where: { userId } }),
    prisma.dashboardLayout.findUnique({ where: { userId } }),
  ]);

  return {
    format: "budgetrax-account-export",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    account,
    transactions,
    budgets,
    recurringTransactions,
    categoryMappings,
    assets,
    liabilities,
    netWorthSnapshots,
    financeAccounts,
    dashboardLayout,
  };
}

/**
 * Permanently deletes a user and every row that references them. Relies on the
 * `onDelete: Cascade` relations declared in prisma/schema.prisma (Transaction,
 * Budget, RecurringTransaction, CategoryMapping, Asset, Liability,
 * NetWorthSnapshot, FinanceAccount, DashboardLayout, Account, Session all
 * cascade from User) — a single delete is sufficient, no manual cleanup needed.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  assertDatabaseUrl();
  await prisma.user.delete({ where: { id: userId } });
}
