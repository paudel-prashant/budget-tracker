"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoldPriceQuote } from "@/lib/currency/gold-price";

const POLL_INTERVAL_MS = 60_000;

/** Live gold spot price in the user's currency; polls while the tab is visible. */
export function useGoldPrice(enabled = true) {
  const [quote, setQuote] = useState<GoldPriceQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/gold-price", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live gold price is unavailable");
      setQuote(data as GoldPriceQuote);
      setError(null);
    } catch (err) {
      // Keep showing the last good quote; just flag that it's stale.
      setError(err instanceof Error ? err.message : "Live gold price is unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return { quote, error, loading, refresh };
}
