export const ASSET_CATEGORIES = [
  "Cash",
  "Investments",
  "Real Estate",
  "Retirement",
  "Other",
] as const;

export const LIABILITY_CATEGORIES = [
  "Credit Card",
  "Loan",
  "Mortgage",
  "Student Loan",
  "Other",
] as const;

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function parsePositiveAmount(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) return null;
  return trimmed;
}

function parseCategory(value: unknown, allowed: readonly string[]): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = allowed.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export type AssetInput = {
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
};

export type LiabilityInput = {
  name: string;
  category: string;
  value: number;
  asOfDate: Date;
  notes: string | null;
};

export function validateAssetBody(body: unknown): ValidationResult<AssetInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;
  const name = parseName(record.name);
  const value = parsePositiveAmount(record.amount ?? record.value);
  const asOfDate = parseDate(record.asOfDate);
  const category = parseCategory(record.category, ASSET_CATEGORIES);

  if (!name || value === null || !asOfDate || !category) {
    return { success: false, error: "Name, category, value, and asOfDate are required" };
  }

  return {
    success: true,
    data: {
      name,
      category,
      value,
      asOfDate,
      notes: typeof record.notes === "string" ? record.notes.trim() || null : null,
    },
  };
}

export function validateLiabilityBody(body: unknown): ValidationResult<LiabilityInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;
  const name = parseName(record.name);
  const value = parsePositiveAmount(record.amount ?? record.value);
  const asOfDate = parseDate(record.asOfDate);
  const category = parseCategory(record.category, LIABILITY_CATEGORIES);

  if (!name || value === null || !asOfDate || !category) {
    return { success: false, error: "Name, category, value, and asOfDate are required" };
  }

  return {
    success: true,
    data: {
      name,
      category,
      value,
      asOfDate,
      notes: typeof record.notes === "string" ? record.notes.trim() || null : null,
    },
  };
}
