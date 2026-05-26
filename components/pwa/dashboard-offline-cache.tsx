"use client";

import { useEffect } from "react";
import type { DashboardLayoutPreferences } from "@/lib/domain/dashboard-layout";
import type { DashboardData } from "@/lib/types";
import { setCachedApiResponse } from "@/lib/pwa/api-cache";
import {
  dashboardDataCacheKey,
  dashboardLayoutCacheKey,
} from "@/lib/pwa/cache-keys";

type DashboardOfflineCacheProps = {
  data: DashboardData;
  layout: DashboardLayoutPreferences;
  children: React.ReactNode;
};

/** Persists latest dashboard payload for offline PWA access. */
export function DashboardOfflineCache({ data, layout, children }: DashboardOfflineCacheProps) {
  useEffect(() => {
    setCachedApiResponse(dashboardDataCacheKey, data);
    setCachedApiResponse(dashboardLayoutCacheKey, layout);
  }, [data, layout]);

  return <>{children}</>;
}
