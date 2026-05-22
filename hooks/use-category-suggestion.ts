"use client";

import { useEffect, useMemo, useState } from "react";
import {
  suggestFromBuiltinKeywords,
  type CategorySuggestion,
} from "@/lib/domain/category-suggestion-engine";
import type { TransactionType } from "@/lib/types";

type UseCategorySuggestionOptions = {
  title: string;
  type: TransactionType;
  enabled?: boolean;
  debounceMs?: number;
};

type UseCategorySuggestionResult = {
  suggestion: CategorySuggestion | null;
  loading: boolean;
};

/**
 * Instant built-in keyword match + debounced API fetch for user-learned mappings.
 */
export function useCategorySuggestion({
  title,
  type,
  enabled = true,
  debounceMs = 350,
}: UseCategorySuggestionOptions): UseCategorySuggestionResult {
  const [learnedSuggestion, setLearnedSuggestion] = useState<CategorySuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const instantSuggestion = useMemo(() => {
    if (!enabled || !title.trim()) return null;
    return suggestFromBuiltinKeywords(title, type);
  }, [enabled, title, type]);

  useEffect(() => {
    if (!enabled) {
      setLearnedSuggestion(null);
      setLoading(false);
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      setLearnedSuggestion(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          title: trimmed,
          type,
        });
        const response = await fetch(`/api/category-suggestions?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setLearnedSuggestion(null);
          return;
        }

        const data = (await response.json()) as { suggestion: CategorySuggestion | null };
        setLearnedSuggestion(data.suggestion);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setLearnedSuggestion(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [title, type, enabled, debounceMs]);

  const suggestion = useMemo(() => {
    if (!enabled || !title.trim()) return null;
    if (learnedSuggestion) return learnedSuggestion;
    return instantSuggestion;
  }, [enabled, title, learnedSuggestion, instantSuggestion]);

  return { suggestion, loading };
}
