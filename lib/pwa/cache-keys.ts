export const dashboardDataCacheKey = "api:/api/dashboard";
export const dashboardLayoutCacheKey = "api:/api/dashboard/layout";

export function transactionsListCacheKey(query: string): string {
  return `api:/api/transactions?${query}`;
}
