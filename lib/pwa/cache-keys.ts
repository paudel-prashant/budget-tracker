export const dashboardDataCacheKey = "api:/api/dashboard";
export const dashboardLayoutCacheKey = "api:/api/dashboard/layout";

export function dashboardMetricsCacheKey(query: string): string {
  return `api:/api/dashboard/metrics?${query}`;
}

export function transactionsListCacheKey(query: string): string {
  return `api:/api/transactions?${query}`;
}
