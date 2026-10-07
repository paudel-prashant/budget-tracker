import { Prisma } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { findMatchingRule, mergeTags } from "@/lib/domain/category-rules";
import { computeTransactionImportHash } from "@/lib/domain/transaction-import-hash";

const UPDATE_CHUNK_SIZE = 25;

export async function listCategoryRules(userId: string) {
  assertDatabaseUrl();

  const [rules, titleCounts] = await Promise.all([
    prisma.categoryRule.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { pattern: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["title", "type"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  // How many existing transactions each rule would categorize — counts only the
  // transactions where this rule is the one that wins (see findMatchingRule).
  const matchCounts = new Map<string, number>();
  for (const row of titleCounts) {
    const winner = findMatchingRule(rules, row.title, row.type);
    if (winner) matchCounts.set(winner.id, (matchCounts.get(winner.id) ?? 0) + row._count._all);
  }

  return rules.map((rule) => ({
    id: rule.id,
    pattern: rule.pattern,
    matchType: rule.matchType,
    type: rule.type,
    category: rule.category,
    tags: rule.tags,
    matchingTransactions: matchCounts.get(rule.id) ?? 0,
    createdAt: rule.createdAt.toISOString(),
  }));
}

/**
 * Re-categorizes existing transactions that this rule matches (where it's the winning
 * rule) and adds its tags. Returns how many transactions changed.
 */
export async function applyCategoryRuleToExisting(
  userId: string,
  ruleId: string
): Promise<number | null> {
  assertDatabaseUrl();

  const rules = await prisma.categoryRule.findMany({ where: { userId } });
  const rule = rules.find((candidate) => candidate.id === ruleId);
  if (!rule) return null;

  const candidates = await prisma.transaction.findMany({
    where: { userId, ...(rule.type ? { type: rule.type } : {}) },
    select: { id: true, title: true, amount: true, type: true, category: true, date: true, tags: true },
  });

  const changes = candidates
    .filter((tx) => findMatchingRule(rules, tx.title, tx.type)?.id === rule.id)
    .map((tx) => ({ tx, tags: mergeTags(tx.tags, rule.tags) }))
    .filter(
      ({ tx, tags }) => tx.category !== rule.category || tags.length !== tx.tags.length
    );

  for (let i = 0; i < changes.length; i += UPDATE_CHUNK_SIZE) {
    await Promise.all(
      changes.slice(i, i + UPDATE_CHUNK_SIZE).map(({ tx, tags }) =>
        updateCategorized(tx, rule.category, tags)
      )
    );
  }

  return changes.length;
}

/**
 * The import hash includes the category, so it's recomputed (as the transaction PATCH
 * route does) to keep re-imports of the same CSV deduplicating. If an identical
 * transaction already holds that hash, the old hash is kept rather than failing.
 */
async function updateCategorized(
  tx: { id: string; title: string; amount: number; type: "INCOME" | "EXPENSE"; date: Date },
  category: string,
  tags: string[]
) {
  const importHash = computeTransactionImportHash({ ...tx, category });

  try {
    await prisma.transaction.update({ where: { id: tx.id }, data: { category, tags, importHash } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await prisma.transaction.update({ where: { id: tx.id }, data: { category, tags } });
      return;
    }
    throw error;
  }
}

export async function listLearnedMappings(userId: string) {
  assertDatabaseUrl();

  const mappings = await prisma.categoryMapping.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, titleKey: true, category: true, type: true, updatedAt: true },
  });

  return mappings.map((mapping) => ({
    ...mapping,
    updatedAt: mapping.updatedAt.toISOString(),
  }));
}
