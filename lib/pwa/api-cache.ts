import {
  OFFLINE_CACHE_MAX_AGE_MS,
  OFFLINE_CACHE_STORAGE_KEY,
} from "@/lib/config/pwa";

type CacheEntry<T> = {
  savedAt: number;
  data: T;
};

type CacheStore = Record<string, CacheEntry<unknown>>;

function readStore(): CacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded */
  }
}

export function getCachedApiResponse<T>(key: string): T | null {
  const store = readStore();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.savedAt > OFFLINE_CACHE_MAX_AGE_MS) {
    delete store[key];
    writeStore(store);
    return null;
  }
  return entry.data as T;
}

export function setCachedApiResponse<T>(key: string, data: T): void {
  const store = readStore();
  store[key] = { savedAt: Date.now(), data };
  writeStore(store);
}

export function isNavigatorOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
