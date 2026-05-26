import {
  getCachedApiResponse,
  isNavigatorOnline,
  setCachedApiResponse,
} from "@/lib/pwa/api-cache";

export type FetchWithCacheResult<T> = {
  data: T;
  fromCache: boolean;
};

export class OfflineFetchError extends Error {
  constructor(message = "You are offline and no cached data is available.") {
    super(message);
    this.name = "OfflineFetchError";
  }
}

/** Network-first fetch with localStorage fallback for PWA offline support. */
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  init?: RequestInit
): Promise<FetchWithCacheResult<T>> {
  const online = isNavigatorOnline();

  if (online) {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message =
          typeof (body as { error?: string }).error === "string"
            ? (body as { error: string }).error
            : response.statusText;
        throw new Error(message || "Request failed");
      }
      const data = (await response.json()) as T;
      setCachedApiResponse(cacheKey, data);
      return { data, fromCache: false };
    } catch (error) {
      const cached = getCachedApiResponse<T>(cacheKey);
      if (cached) {
        return { data: cached, fromCache: true };
      }
      throw error;
    }
  }

  const cached = getCachedApiResponse<T>(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  throw new OfflineFetchError();
}
