import { TransactionType } from "@prisma/client";
import type { CsvTransactionRow } from "@/lib/services/csv-utils";
import { computeTransactionImportHash } from "@/lib/domain/transaction-import-hash";
import { startOfUtcDay } from "@/lib/domain/recurrence-dates";

export type ParsedTransactionRow = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  importHash: string;
};

export type ImportRowStatus = "valid" | "invalid" | "duplicate";

export type ImportPreviewRow = {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  data: ParsedTransactionRow | null;
};

export type ImportPreviewResult = {
  rows: ImportPreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
  };
};

function parseTransactionType(value: string): TransactionType | null {
  const normalized = value.trim().toUpperCase();

  if (normalized === "INCOME" || normalized === "IN") {
    return TransactionType.INCOME;
  }

  if (normalized === "EXPENSE" || normalized === "OUT") {
    return TransactionType.EXPENSE;
  }

  return null;
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "").trim();

  if (!cleaned) return null;

  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  const parsed = isoMatch ? new Date(`${trimmed.slice(0, 10)}T00:00:00.000Z`) : new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfUtcDay(parsed);
}

export function validateCsvTransactionRow(
  row: CsvTransactionRow,
  rowNumber: number
): ImportPreviewRow {
  const errors: string[] = [];

  const title = (row.title ?? "").trim();
  const category = (row.category ?? "").trim();
  const type = parseTransactionType(row.type ?? "");
  const amount = parseAmount(row.amount ?? "");
  const date = parseDate(row.date ?? "");

  if (!title) errors.push("title is required");
  if (!category) errors.push("category is required");
  if (!type) errors.push("type must be INCOME or EXPENSE");
  if (amount === null) errors.push("amount must be a positive number");
  if (!date) errors.push("date must be a valid date (YYYY-MM-DD recommended)");

  if (errors.length > 0 || !type || amount === null || !date) {
    return {
      rowNumber,
      status: "invalid",
      errors,
      data: null,
    };
  }

  const parsed: ParsedTransactionRow = {
    title,
    amount,
    type,
    category,
    date,
    importHash: computeTransactionImportHash({
      title,
      amount,
      type,
      category,
      date,
    }),
  };

  return {
    rowNumber,
    status: "valid",
    errors: [],
    data: parsed,
  };
}

export function buildImportPreview(
  csvRows: CsvTransactionRow[],
  existingHashes: Set<string>
): ImportPreviewResult {
  const rows: ImportPreviewRow[] = csvRows.map((row, index) => {
    const validated = validateCsvTransactionRow(row, index + 2);

    if (validated.status === "invalid" || !validated.data) {
      return validated;
    }

    if (existingHashes.has(validated.data.importHash)) {
      return {
        rowNumber: validated.rowNumber,
        status: "duplicate",
        errors: ["Duplicate transaction already exists in your data"],
        data: validated.data,
      };
    }

    return validated;
  });

  const valid = rows.filter((r) => r.status === "valid").length;
  const invalid = rows.filter((r) => r.status === "invalid").length;
  const duplicate = rows.filter((r) => r.status === "duplicate").length;

  return {
    rows,
    summary: {
      total: rows.length,
      valid,
      invalid,
      duplicate,
    },
  };
}

export function summarizeImportPreview(rows: ImportPreviewRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };
}

export function dedupePreviewRows(rows: ImportPreviewRow[]): ImportPreviewRow[] {
  const seenHashes = new Set<string>();

  return rows.map((row) => {
    if (row.status !== "valid" || !row.data) {
      return row;
    }

    if (seenHashes.has(row.data.importHash)) {
      return {
        ...row,
        status: "duplicate" as const,
        errors: ["Duplicate row within this CSV file"],
      };
    }

    seenHashes.add(row.data.importHash);
    return row;
  });
}
