"use client";

import { useCallback, useEffect, useState } from "react";
import type { ForecastEngineResult, ForecastTimeframe } from "@/lib/forecasting";

type UseForecastOptions = {
  initialTimeframe?: ForecastTimeframe;
  initialData?: ForecastEngineResult | null;
};

export function useForecast({
  initialTimeframe = "30d",
  initialData = null,
}: UseForecastOptions = {}) {
  const [timeframe, setTimeframe] = useState<ForecastTimeframe>(initialTimeframe);
  const [forecast, setForecast] = useState<ForecastEngineResult | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (nextTimeframe: ForecastTimeframe) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forecast?timeframe=${nextTimeframe}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load forecast");
      }
      const data = (await response.json()) as ForecastEngineResult;
      setForecast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchForecast(timeframe);
  }, [timeframe, fetchForecast]);

  const changeTimeframe = useCallback((next: ForecastTimeframe) => {
    setTimeframe(next);
  }, []);

  return {
    forecast,
    timeframe,
    loading,
    error,
    changeTimeframe,
    refetch: () => fetchForecast(timeframe),
  };
}
