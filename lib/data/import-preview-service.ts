import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { CsvTransactionRow } from "@/lib/services/csv-utils";
import {
  dedupePreviewRows,
  summarizeImportPreview,
  validateCsvTransactionRow,
  type ImportPreviewRow,
  type RowCategorizer,
} from "@/lib/services/csv-transaction-import";
import {
  getCategoryRulesForUser,
  getLearnedMappingsForUser,
} from "@/lib/domain/category-mapping-service";
import { findMatchingRule, type CategoryRuleLike } from "@/lib/domain/category-rules";
import {
  suggestCategory,
  type LearnedCategoryMapping,
} from "@/lib/domain/category-suggestion-engine";

/**
 * Category precedence on import: the user's rules always win (that's what a rule is for,
 * and bank exports often carry their own categories), then the CSV's category, then a
 * learned/keyword suggestion for rows that have none.
 */
export function buildImportCategorizer(
  rules: CategoryRuleLike[],
  learned: LearnedCategoryMapping[]
): RowCategorizer {
  return (title, type, csvCategory) => {
    const rule = findMatchingRule(rules, title, type);
    if (rule) return { category: rule.category, tags: rule.tags, source: "rule" };
    if (csvCategory) return null;

    const suggestion = suggestCategory(title, type, learned);
    return suggestion ? { category: suggestion.category, tags: [], source: "suggested" } : null;
  };
}

export async function prepareImportPreview(userId: string, csvRows: CsvTransactionRow[]) {
  assertDatabaseUrl();

  const [rules, learned] = await Promise.all([
    getCategoryRulesForUser(userId),
    getLearnedMappingsForUser(userId),
  ]);
  const categorize = buildImportCategorizer(rules, learned);

  const validated = csvRows.map((row, index) =>
    validateCsvTransactionRow(row, index + 2, categorize)
  );
  const fileDeduped = dedupePreviewRows(validated);

  const candidateHashes = fileDeduped
    .filter((row) => row.status === "valid" && row.data)
    .map((row) => row.data!.importHash);

  const existingHashes = new Set<string>();

  if (candidateHashes.length > 0) {
    const existing = await prisma.transaction.findMany({
      where: { userId, importHash: { in: candidateHashes } },
      select: { importHash: true },
    });

    for (const row of existing) {
      if (row.importHash) {
        existingHashes.add(row.importHash);
      }
    }
  }

  const rows: ImportPreviewRow[] = fileDeduped.map((row) => {
    if (row.status === "valid" && row.data && existingHashes.has(row.data.importHash)) {
      return {
        ...row,
        status: "duplicate",
        errors: ["Duplicate transaction already exists in your data"],
      };
    }
    return row;
  });

  return {
    rows,
    summary: summarizeImportPreview(rows),
  };
}
