import { describe, expect, it, vi } from "vitest";
import { TransactionType } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/config/env", () => ({ assertDatabaseUrl: vi.fn() }));

const { buildImportCategorizer } = await import("@/lib/data/import-preview-service");
const { validateCsvTransactionRow } = await import("@/lib/services/csv-transaction-import");

const categorize = buildImportCategorizer(
  [
    {
      id: "r1",
      pattern: "uber",
      matchType: "CONTAINS",
      type: "EXPENSE",
      category: "Transportation",
      tags: ["work"],
    },
  ],
  [{ titleKey: "corner store", category: "Groceries", type: "EXPENSE" }]
);

function row(title: string, category = "") {
  return { title, amount: "12.50", type: "EXPENSE", category, date: "2026-10-01" };
}

describe("import categorization", () => {
  it("applies a matching rule even when the CSV has its own category", () => {
    const result = validateCsvTransactionRow(row("UBER *TRIP", "Travel"), 2, categorize);
    expect(result.status).toBe("valid");
    expect(result.data).toMatchObject({
      category: "Transportation",
      tags: ["work"],
      categorySource: "rule",
    });
  });

  it("keeps the CSV category when no rule matches", () => {
    const result = validateCsvTransactionRow(row("Corner Store", "Snacks"), 2, categorize);
    expect(result.data).toMatchObject({ category: "Snacks", categorySource: "csv", tags: [] });
  });

  it("fills a missing category from learned mappings or keywords", () => {
    expect(validateCsvTransactionRow(row("Corner Store"), 2, categorize).data).toMatchObject({
      category: "Groceries",
      categorySource: "suggested",
    });
    expect(validateCsvTransactionRow(row("Netflix"), 2, categorize).data).toMatchObject({
      category: "Entertainment",
      categorySource: "suggested",
    });
  });

  it("marks the row invalid when nothing can categorize it", () => {
    const result = validateCsvTransactionRow(row("Zxqv Ltd"), 2, categorize);
    expect(result.status).toBe("invalid");
    expect(result.errors[0]).toMatch(/category is required/);
  });

  it("hashes the final category so re-importing the same file still deduplicates", () => {
    const first = validateCsvTransactionRow(row("Uber trip", "Travel"), 2, categorize);
    const second = validateCsvTransactionRow(row("Uber trip", "Taxi"), 3, categorize);
    expect(first.data?.importHash).toBe(second.data?.importHash);
    expect(first.data?.type).toBe(TransactionType.EXPENSE);
  });
});
