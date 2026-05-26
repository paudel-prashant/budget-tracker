"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Box, CircularProgress, Typography } from "@mui/material";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { usePwa } from "@/components/pwa/pwa-provider";
import { getCachedApiResponse } from "@/lib/pwa/api-cache";
import {
  dashboardDataCacheKey,
  dashboardLayoutCacheKey,
} from "@/lib/pwa/cache-keys";
import type { DashboardData } from "@/lib/types";
import type { DashboardLayoutPreferences } from "@/lib/domain/dashboard-layout";

type DashboardOfflineShellProps = {
  initialData: DashboardData;
  initialLayout: DashboardLayoutPreferences;
};

export function DashboardOfflineShell({
  initialData,
  initialLayout,
}: DashboardOfflineShellProps) {
  const { isOnline } = usePwa();
  const [data, setData] = useState(initialData);
  const [layout, setLayout] = useState(initialLayout);
  const [fromCache, setFromCache] = useState(false);
  const [hydrating, setHydrating] = useState(false);

  const hydrateFromCache = useCallback(() => {
    if (isOnline) {
      setFromCache(false);
      return;
    }

    setHydrating(true);
    const cached = getCachedApiResponse<DashboardData>(dashboardDataCacheKey);
    if (cached) {
      setData(cached);
      setFromCache(true);
    }
    const layoutCached = getCachedApiResponse<DashboardLayoutPreferences>(
      dashboardLayoutCacheKey
    );
    if (layoutCached) setLayout(layoutCached);
    setHydrating(false);
  }, [isOnline]);

  useEffect(() => {
    hydrateFromCache();
  }, [hydrateFromCache]);

  useEffect(() => {
    if (isOnline) {
      setData(initialData);
      setLayout(initialLayout);
      setFromCache(false);
    }
  }, [isOnline, initialData, initialLayout]);

  if (!isOnline && hydrating && !data) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading cached dashboard…
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <OfflineBanner showingCachedData={fromCache || !isOnline} />
      <DashboardView data={data} initialLayout={layout} />
    </>
  );
}
