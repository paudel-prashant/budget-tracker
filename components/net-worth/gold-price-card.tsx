"use client";

import { Box, Button, Divider, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency } from "@/lib/utils/format";
import { goldHoldingValue, GRAMS_PER_TROY_OUNCE } from "@/lib/domain/gold";
import type { GoldPriceQuote } from "@/lib/currency/gold-price";
import type { Asset } from "@/lib/types";

type GoldPriceCardProps = {
  quote: GoldPriceQuote | null;
  loading: boolean;
  error: string | null;
  holdings: Asset[];
  onAddHolding: () => void;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color={color} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

export function GoldPriceCard({ quote, loading, error, holdings, onAddHolding }: GoldPriceCardProps) {
  const currency = quote?.currency;
  const pureGrams = holdings.reduce((sum, h) => sum + (h.goldGrams ?? 0) * (h.goldPurity ?? 0), 0);
  // Live value from the polled quote, so it moves even between net-worth reloads.
  const liveValue = quote
    ? holdings.reduce(
        (sum, h) => sum + goldHoldingValue(h.goldGrams ?? 0, h.goldPurity ?? 0, quote.pricePerOunce),
        0
      )
    : holdings.reduce((sum, h) => sum + h.value, 0);
  const costed = holdings.filter((h) => h.costBasis !== null);
  const totalCost = costed.reduce((sum, h) => sum + (h.costBasis ?? 0), 0);
  const costedValue = quote
    ? costed.reduce(
        (sum, h) => sum + goldHoldingValue(h.goldGrams ?? 0, h.goldPurity ?? 0, quote.pricePerOunce),
        0
      )
    : costed.reduce((sum, h) => sum + h.value, 0);
  const gain = costedValue - totalCost;

  return (
    <SurfaceCard accentColor="#C9A227" sx={{ p: CARD_PADDING }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: error ? "warning.main" : "success.main",
              }}
            />
            <Typography variant="subtitle2">Gold spot price{currency ? ` (${currency})` : ""}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {error && quote
              ? `Couldn't refresh. Showing the price from ${formatTime(quote.updatedAt)}`
              : error
                ? error
                : quote
                  ? `Live · updated ${formatTime(quote.updatedAt)} · via ${quote.provider}`
                  : "Loading live price…"}
          </Typography>
        </Box>
        <Button size="small" startIcon={<AddOutlinedIcon />} onClick={onAddHolding}>
          Add gold
        </Button>
      </Stack>

      {loading && !quote ? (
        <Skeleton variant="rounded" height={52} sx={{ mt: 2 }} />
      ) : quote ? (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Metric label="Per troy ounce" value={formatCurrency(quote.pricePerOunce, currency)} />
          <Metric label="Per gram (24K)" value={formatCurrency(quote.pricePerGram, currency)} />
          <Metric label="Per gram (22K)" value={formatCurrency(quote.pricePerGram * 0.9167, currency)} />
          <Metric
            label="Per tola (24K)"
            value={formatCurrency(quote.pricePerGram * 11.6638038, currency)}
          />
        </Box>
      ) : null}

      {holdings.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <Tooltip title={`${(pureGrams / GRAMS_PER_TROY_OUNCE).toFixed(3)} troy oz of pure gold`}>
              <Box>
                <Metric label="Your gold (pure)" value={`${pureGrams.toFixed(2)} g`} />
              </Box>
            </Tooltip>
            <Metric label="Market value" value={formatCurrency(liveValue, currency)} color="success.main" />
            {costed.length > 0 && (
              <Metric
                label={`Gain / loss${totalCost > 0 ? ` (${((gain / totalCost) * 100).toFixed(1)}%)` : ""}`}
                value={`${gain >= 0 ? "+" : "−"}${formatCurrency(Math.abs(gain), currency)}`}
                color={gain >= 0 ? "success.main" : "error.main"}
              />
            )}
          </Box>
        </>
      )}
    </SurfaceCard>
  );
}
