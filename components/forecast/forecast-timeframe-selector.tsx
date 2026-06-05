"use client";

import { ToggleButton, ToggleButtonGroup, useMediaQuery, useTheme } from "@mui/material";
import type { ForecastTimeframe } from "@/lib/forecasting";

const OPTIONS: Array<{ value: ForecastTimeframe; label: string }> = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "180d", label: "180 Days" },
];

type ForecastTimeframeSelectorProps = {
  value: ForecastTimeframe;
  onChange: (value: ForecastTimeframe) => void;
  disabled?: boolean;
};

export function ForecastTimeframeSelector({
  value,
  onChange,
  disabled = false,
}: ForecastTimeframeSelectorProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, next: ForecastTimeframe | null) => {
        if (next) onChange(next);
      }}
      size="small"
      disabled={disabled}
      aria-label="Forecast period"
      sx={{
        flexWrap: "wrap",
        gap: 0.75,
        width: { xs: "100%", sm: "auto" },
        "& .MuiToggleButtonGroup-grouped": {
          border: 1,
          borderColor: "divider",
          borderRadius: "10px !important",
          margin: 0,
          flex: compact ? "1 1 calc(50% - 6px)" : "0 1 auto",
          minWidth: compact ? 0 : undefined,
          textTransform: "none",
          typography: "body2",
          fontWeight: 600,
          px: 1.75,
          py: 0.75,
        },
      }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
