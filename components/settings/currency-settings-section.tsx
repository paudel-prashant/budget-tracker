"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FRANKFURTER_DOCS_URL,
  SUPPORTED_CURRENCIES,
  type SupportedCurrencyCode,
} from "@/lib/currency/constants";
import { useCurrency } from "@/components/shared/providers/currency-provider";
import { formatCurrency } from "@/lib/utils/format";
import { CARD_PADDING } from "@/lib/config/layout-constants";

type CurrencySettingsResponse = {
  preferredCurrency: SupportedCurrencyCode;
  rates: {
    base: string;
    date: string;
    rates: Record<string, number>;
  };
  provider: string;
  providerUrl: string;
};

export function CurrencySettingsSection() {
  const { currency, setCurrency } = useCurrency();
  const [settings, setSettings] = useState<CurrencySettingsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/settings/currency");
    if (!response.ok) {
      throw new Error("Failed to load currency settings");
    }
    const data = (await response.json()) as CurrencySettingsResponse;
    setSettings(data);
    setCurrency(data.preferredCurrency);
  }, [setCurrency]);

  useEffect(() => {
    void loadSettings().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load currency settings");
    });
  }, [loadSettings]);

  const handleChange = async (nextCurrency: SupportedCurrencyCode) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredCurrency: nextCurrency }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save currency");
      }

      const data = (await response.json()) as CurrencySettingsResponse;
      setSettings(data);
      setCurrency(data.preferredCurrency);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save currency");
    } finally {
      setSaving(false);
    }
  };

  const rateEntries = Object.entries(settings?.rates.rates ?? {});

  return (
    <Stack sx={{ p: CARD_PADDING }} spacing={1.5}>
      <Typography variant="subtitle1">Currency</Typography>
      <Typography variant="body2" color="text.secondary">
        Choose your base currency for dashboards, budgets, and reports. Transactions in other
        currencies are converted using live ECB exchange rates from{" "}
        <MuiLink href={FRANKFURTER_DOCS_URL} target="_blank" rel="noopener noreferrer">
          Frankfurter
        </MuiLink>
        .
      </Typography>

      <TextField
        select
        label="Base currency"
        value={currency}
        onChange={(event) => void handleChange(event.target.value as SupportedCurrencyCode)}
        disabled={saving}
        size="small"
        sx={{ maxWidth: 360 }}
        InputProps={{
          endAdornment: saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : undefined,
        }}
      >
        {SUPPORTED_CURRENCIES.map((option) => (
          <MenuItem key={option.code} value={option.code}>
            {option.code} — {option.label}
          </MenuItem>
        ))}
      </TextField>

      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {settings && rateEntries.length > 0 && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.5,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Latest rates (1 {settings.rates.base} → …) · updated {settings.rates.date}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {rateEntries.map(([code, rate]) => (
              <Typography key={code} variant="caption" sx={{ fontWeight: 600 }}>
                {code} {rate.toFixed(4)}
              </Typography>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Example: {formatCurrency(100, settings.rates.base)} ≈{" "}
            {rateEntries[0]
              ? formatCurrency(100 * rateEntries[0][1], rateEntries[0][0])
              : "—"}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
