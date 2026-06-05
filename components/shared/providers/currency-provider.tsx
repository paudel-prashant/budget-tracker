"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CURRENCY, normalizeCurrencyCode } from "@/lib/currency/constants";
import { setDisplayCurrency } from "@/lib/utils/format";

type CurrencyContextValue = {
  currency: string;
  setCurrency: (code: string) => void;
  loading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => undefined,
  loading: false,
});

type CurrencyProviderProps = {
  children: ReactNode;
  initialCurrency?: string;
};

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const normalizedInitial = normalizeCurrencyCode(initialCurrency);
  const [currency, setCurrencyState] = useState(normalizedInitial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayCurrency(normalizedInitial);
    setCurrencyState(normalizedInitial);
  }, [normalizedInitial]);

  const setCurrency = useCallback((code: string) => {
    const next = normalizeCurrencyCode(code);
    setCurrencyState(next);
    setDisplayCurrency(next);
  }, []);

  const refreshFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/currency");
      if (!response.ok) return;
      const data = (await response.json()) as { preferredCurrency?: string };
      if (data.preferredCurrency) {
        setCurrency(data.preferredCurrency);
      }
    } finally {
      setLoading(false);
    }
  }, [setCurrency]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  const value = useMemo(
    () => ({ currency, setCurrency, loading }),
    [currency, setCurrency, loading]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
