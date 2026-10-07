"use client";

import { useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatDayKey } from "@/lib/utils/format";
import type {
  DetectedSuggestion,
  PriceIncreaseSuggestion,
  SubscriptionSuggestion,
} from "@/lib/domain/subscription-detection";

const FREQUENCY_LABELS = { WEEKLY: "weekly", MONTHLY: "monthly", YEARLY: "yearly" } as const;
const INITIAL_VISIBLE = 4;

type SubscriptionSuggestionsPanelProps = {
  suggestions: DetectedSuggestion[];
  busyKey: string | null;
  onTrack: (suggestion: SubscriptionSuggestion) => void;
  onUpdatePrice: (suggestion: PriceIncreaseSuggestion) => void;
  onDismiss: (suggestion: DetectedSuggestion) => void;
};

function PriceChangeText({ previous, next }: { previous: number; next: number }) {
  return (
    <>
      went from {formatCurrency(previous)} to{" "}
      <Box component="strong" sx={{ color: "warning.main" }}>
        {formatCurrency(next)}
      </Box>
    </>
  );
}

export function SubscriptionSuggestionsPanel({
  suggestions,
  busyKey,
  onTrack,
  onUpdatePrice,
  onDismiss,
}: SubscriptionSuggestionsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  if (suggestions.length === 0) return null;

  const visible = showAll ? suggestions : suggestions.slice(0, INITIAL_VISIBLE);

  return (
    <SectionPanel sx={{ mb: 3 }}>
      <Box sx={{ p: CARD_PADDING, pb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="h6">Detected in your transactions</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Repeating charges that aren&apos;t tracked yet, and price increases on ones that are.
        </Typography>
      </Box>
      <Divider />
      {visible.map((suggestion, index) => (
        <Box key={suggestion.key}>
          {index > 0 && <Divider />}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 2 }}
            alignItems={{ sm: "center" }}
            sx={{ px: CARD_PADDING, py: 1.75 }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {suggestion.kind === "subscription" ? (
                <>
                  <Typography variant="subtitle2" noWrap>
                    {suggestion.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(suggestion.amount)} {FREQUENCY_LABELS[suggestion.frequency]} ·{" "}
                    {suggestion.chargeCount} charges · last {formatDayKey(suggestion.lastChargeDate)}
                  </Typography>
                  {suggestion.priceChange && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <TrendingUpOutlinedIcon
                        fontSize="inherit"
                        sx={{ verticalAlign: "middle", mr: 0.5, color: "warning.main" }}
                      />
                      Price{" "}
                      <PriceChangeText
                        previous={suggestion.priceChange.previousAmount}
                        next={suggestion.priceChange.newAmount}
                      />{" "}
                      on {formatDayKey(suggestion.priceChange.changedOn)}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" noWrap>
                      {suggestion.title}
                    </Typography>
                    <Chip label="Price increase" size="small" color="warning" variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Charged{" "}
                    <PriceChangeText
                      previous={suggestion.priceChange.previousAmount}
                      next={suggestion.priceChange.newAmount}
                    />{" "}
                    on {formatDayKey(suggestion.priceChange.changedOn)} — your recurring item still
                    says {formatCurrency(suggestion.recurringAmount)}.
                  </Typography>
                </>
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                disabled={busyKey === suggestion.key}
                onClick={() => onDismiss(suggestion)}
              >
                Dismiss
              </Button>
              {suggestion.kind === "subscription" ? (
                <Button size="small" variant="contained" onClick={() => onTrack(suggestion)}>
                  Track as recurring
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  disabled={busyKey === suggestion.key}
                  onClick={() => onUpdatePrice(suggestion)}
                >
                  Update to {formatCurrency(suggestion.priceChange.newAmount)}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      ))}
      {suggestions.length > INITIAL_VISIBLE && (
        <>
          <Divider />
          <Box sx={{ px: CARD_PADDING, py: 1 }}>
            <Button size="small" onClick={() => setShowAll((prev) => !prev)}>
              {showAll ? "Show less" : `Show all ${suggestions.length}`}
            </Button>
          </Box>
        </>
      )}
    </SectionPanel>
  );
}
