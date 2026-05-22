import type { Prisma } from "@prisma/client";
import type { TransactionType } from "@/lib/types";

export type TransactionFilters = {
  search?: string;
  category?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
};

export type TransactionListParams = TransactionFilters & {
  page: number;
  pageSize: number;
};

export type TransactionListMeta = {
  categories: string[];
  totalUnfiltered: number;
};

export type TransactionListResponse = {
  data: Array<{
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta: TransactionListMeta;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function parseOptionalFloat(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parseIsoDate(value: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseTransactionType(value: string | null): TransactionType | undefined {
  if (value === "INCOME" || value === "EXPENSE") return value;
  return undefined;
}

export function parseTransactionListParams(
  searchParams: URLSearchParams
): { success: true; params: TransactionListParams } | { success: false; error: string } {
  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = Math.min(
    parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  const minAmount = parseOptionalFloat(searchParams.get("minAmount"));
  const maxAmount = parseOptionalFloat(searchParams.get("maxAmount"));

  if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
    return { success: false, error: "minAmount cannot be greater than maxAmount" };
  }

  const dateFrom = parseIsoDate(searchParams.get("dateFrom"));
  const dateTo = parseIsoDate(searchParams.get("dateTo"));

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return { success: false, error: "dateFrom cannot be after dateTo" };
  }

  const search = searchParams.get("q")?.trim() || searchParams.get("search")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const type = parseTransactionType(searchParams.get("type"));

  return {
    success: true,
    params: {
      page,
      pageSize,
      search: search || undefined,
      category: category || undefined,
      type,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
    },
  };
}

export function buildTransactionWhere(
  userId: string,
  filters: TransactionFilters
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.category) {
    where.category = { equals: filters.category, mode: "insensitive" };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      where.date.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setUTCHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = filters.maxAmount;
    }
  }

  return where;
}

export function buildTransactionListQuery(params: TransactionListParams): string {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  if (params.search) query.set("q", params.search);
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.minAmount !== undefined) query.set("minAmount", String(params.minAmount));
  if (params.maxAmount !== undefined) query.set("maxAmount", String(params.maxAmount));

  return query.toString();
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.search) count += 1;
  if (filters.category) count += 1;
  if (filters.type) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  if (filters.minAmount !== undefined) count += 1;
  if (filters.maxAmount !== undefined) count += 1;
  return count;
}

export const EMPTY_TRANSACTION_FILTERS: TransactionFilters = {};

export const DEFAULT_TRANSACTION_LIST_PARAMS: TransactionListParams = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
};
