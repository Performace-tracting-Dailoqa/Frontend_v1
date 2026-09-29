"use client";

/**
 * Client-side caching and prefetching manager.
 *
 * Requirements:
 * 1. Fetch content when the website is loaded and save in cache.
 * 2. Serve cached content instantly when navigating between tabs/pages.
 * 3. Cache TTL: 1 hour (3,600,000 ms). Refetches automatically after 1 hour or when manually refreshed.
 * 4. Invalidation: Mutations (POST, PUT, DELETE) automatically clear related cached endpoints.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const CACHE_STORAGE_PREFIX = "dailoqa_cache_v1:";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

// In-memory runtime cache for lightning-fast reads
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Safe access to sessionStorage
function getSessionStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CACHE_STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function setSessionStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_STORAGE_PREFIX + key, value);
  } catch {
    // Ignore quota errors in storage
  }
}

function removeSessionStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CACHE_STORAGE_PREFIX + key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieve cached data for a given URL/key if it exists and has not expired (within 1 hour).
 */
export function getCachedData<T>(key: string, customTtlMs: number = ONE_HOUR_MS): T | null {
  const now = Date.now();

  // 1. Check memory cache first
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry) {
    if (now - memEntry.timestamp < memEntry.ttlMs) {
      return memEntry.data;
    }
    // Expired
    memoryCache.delete(key);
  }

  // 2. Fall back to sessionStorage
  const raw = getSessionStorageItem(key);
  if (raw) {
    try {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (now - parsed.timestamp < (parsed.ttlMs || customTtlMs)) {
        // Re-populate in-memory cache
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      removeSessionStorageItem(key);
    } catch {
      removeSessionStorageItem(key);
    }
  }

  return null;
}

/**
 * Store data in the cache with timestamp and TTL (default 1 hour).
 */
export function setCachedData<T>(key: string, data: T, ttlMs: number = ONE_HOUR_MS): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };

  memoryCache.set(key, entry);

  try {
    setSessionStorageItem(key, JSON.stringify(entry));
  } catch {
    // Ignore serialization errors for non-serializable objects
  }
}

/**
 * Invalidate a specific cache key, keys matching a prefix/regex, or all cache.
 */
export function invalidateCache(keyPattern?: string): void {
  if (!keyPattern) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith(CACHE_STORAGE_PREFIX)) {
            keysToRemove.push(key.slice(CACHE_STORAGE_PREFIX.length));
          }
        }
        for (const k of keysToRemove) {
          removeSessionStorageItem(k);
        }
      } catch {
        // Ignore
      }
    }
    return;
  }

  // Invalidate matching keys
  for (const k of Array.from(memoryCache.keys())) {
    if (k.includes(keyPattern)) {
      memoryCache.delete(k);
      removeSessionStorageItem(k);
    }
  }
}

/**
 * Background prefetching helper: prefetches core dashboard data on initial load.
 */
let isPrefetching = false;

export async function prefetchDashboardData(
  fetchFn: (url: string) => Promise<unknown>,
  role?: string
): Promise<void> {
  if (typeof window === "undefined" || isPrefetching) return;
  isPrefetching = true;

  try {
    const norm = (role || "").toLowerCase();
    const urlsToPrefetch: string[] = [];

    if (norm.includes("admin") || norm.includes("super")) {
      urlsToPrefetch.push(
        "/api/v1/superuser/overview",
        "/api/v1/superuser/teams?page=1&page_size=50",
        "/api/v1/superuser/progress?sort_by=completion",
        "/api/v1/superuser/progress/trend?days=30",
        "/api/v1/hr?page=1&page_size=100",
        "/api/v1/managers?page=1&page_size=100",
        "/api/v1/teachers?page=1&page_size=100",
        "/api/v1/students?page=1&page_size=100",
        "/api/v1/batches",
        "/api/v1/health"
      );
    } else if (norm.includes("hr")) {
      urlsToPrefetch.push(
        "/api/v1/hr?page=1&page_size=100",
        "/api/v1/managers?page=1&page_size=100",
        "/api/v1/teachers?page=1&page_size=100",
        "/api/v1/students?page=1&page_size=100",
        "/api/v1/batches"
      );
    }

    // Prefetch in background with staggered timing
    for (const url of urlsToPrefetch) {
      if (!getCachedData(url)) {
        try {
          await fetchFn(url);
        } catch {
          // Prefetch failures are non-blocking
        }
      }
    }
  } finally {
    isPrefetching = false;
  }
}
