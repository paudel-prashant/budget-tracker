export const PWA_THEME_COLOR = "#5B4FCF";
export const PWA_BACKGROUND_COLOR = "#F1F5F9";

export const PWA_CACHEABLE_API_PREFIXES = [
  "/api/dashboard",
  "/api/transactions",
  "/api/summary",
  "/api/insights",
  "/api/budgets",
] as const;

export const OFFLINE_CACHE_STORAGE_KEY = "budgetrax-offline-api-v1";
export const OFFLINE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours
