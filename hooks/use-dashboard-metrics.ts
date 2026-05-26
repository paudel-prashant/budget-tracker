"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDashboardMetricsQuery,
  resolveDashboardDateRange,
} from "@/lib/domain/dashboard-date-range";
import { fetchWithCache } from "@/lib/pwa/fetch-with-cache";
import { dashboardMetricsCacheKey } from "@/lib/pwa/cache-keys";
import type { DashboardDateRange, DashboardMetrics } from "@/lib/types";

const STORAGE_KEY = "dashboard:date-range";

type UseDashboardMetricsOptions = {
  initialMetrics: DashboardMetrics;
};

function readStoredRange(): DashboardDateRange | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DashboardDateRange;
    resolveDashboardDateRange(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredRange(range: DashboardDateRange) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function useDashboardMetrics({ initialMetrics }: UseDashboardMetricsOptions) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const hydratedRef = useRef(false);

  const applyRangeInternal = useCallback(async (nextRange: DashboardDateRange) => {
    const resolved = resolveDashboardDateRange(nextRange);
    const serialized = {
      preset: resolved.preset,
      dateFrom: resolved.dateFrom,
      dateTo: resolved.dateTo,
    };

    const query = buildDashboardMetricsQuery(serialized);
    const currentQuery = buildDashboardMetricsQuery(metrics.dateRange);

    if (query === currentQuery) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchWithCache<DashboardMetrics>(
        `/api/dashboard/metrics?${query}`,
        dashboardMetricsCacheKey(query)
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setMetrics(result.data);
      writeStoredRange(result.data.dateRange);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load dashboard metrics");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [metrics.dateRange]);

  const applyRange = useCallback(
    (nextRange: DashboardDateRange) => {
      writeStoredRange(nextRange);
      return applyRangeInternal(nextRange);
    },
    [applyRangeInternal]
  );

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;
    const stored = readStoredRange();
    if (!stored) {
      return;
    }
    const storedQuery = buildDashboardMetricsQuery(stored);
    const initialQuery = buildDashboardMetricsQuery(initialMetrics.dateRange);
    if (storedQuery !== initialQuery) {
      void applyRangeInternal(stored);
    }
  }, [applyRangeInternal, initialMetrics.dateRange]);

  useEffect(() => {
    const initialQuery = buildDashboardMetricsQuery(initialMetrics.dateRange);
    const currentQuery = buildDashboardMetricsQuery(metrics.dateRange);
    if (initialQuery === currentQuery && !loading) {
      setMetrics(initialMetrics);
    }
  }, [initialMetrics, loading, metrics.dateRange]);

  return {
    metrics,
    loading,
    error,
    applyRange,
    clearError: () => setError(null),
  };
}
