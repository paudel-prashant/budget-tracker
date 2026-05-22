import { assertDatabaseUrl } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import type { CsvTransactionRow } from "@/lib/services/csv-utils";
import {
  dedupePreviewRows,
  summarizeImportPreview,
  validateCsvTransactionRow,
  type ImportPreviewRow,
} from "@/lib/services/csv-transaction-import";

export async function prepareImportPreview(userId: string, csvRows: CsvTransactionRow[]) {
  assertDatabaseUrl();

  const validated = csvRows.map((row, index) => validateCsvTransactionRow(row, index + 2));
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
