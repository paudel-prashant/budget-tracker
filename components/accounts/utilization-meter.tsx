"use client";

import { Box, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import {
  UTILIZATION_FAIR_THRESHOLD,
  utilizationLevel,
  type UtilizationLevel,
} from "@/lib/domain/account-net-worth";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

const LEVEL_META: Record<
  UtilizationLevel,
  { label: string; color: "success" | "warning" | "error"; Icon: typeof CheckCircleOutlineIcon }
> = {
  good: { label: "Healthy", color: "success", Icon: CheckCircleOutlineIcon },
  fair: { label: "Watch", color: "warning", Icon: ReportProblemOutlinedIcon },
  high: { label: "High", color: "error", Icon: ErrorOutlineIcon },
};

/** Severity as text + icon, so state never relies on color alone. */
export function UtilizationStatus({ percent }: { percent: number }) {
  const meta = LEVEL_META[utilizationLevel(percent)];
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <meta.Icon sx={{ fontSize: 16, color: `${meta.color}.main` }} />
      <Typography variant="caption" color="text.secondary">
        {meta.label}
      </Typography>
    </Stack>
  );
}

type UtilizationMeterProps = {
  owed: number;
  creditLimit: number;
  utilization: number;
  /** Compact = no text row underneath (the caller shows its own). */
  compact?: boolean;
};

/**
 * One card's balance against its limit. The fill carries severity; the track is a lighter
 * step of the same color; a tick marks the 30% guideline.
 */
export function UtilizationMeter({ owed, creditLimit, utilization, compact }: UtilizationMeterProps) {
  const theme = useTheme();
  const color = theme.palette[LEVEL_META[utilizationLevel(utilization)].color].main;
  const fill = Math.min(100, Math.max(0, utilization));

  return (
    <Box>
      <Tooltip
        title={`${formatCurrency(owed)} of ${formatCurrency(creditLimit)} used · ${formatCurrency(
          Math.max(0, creditLimit - owed)
        )} available`}
      >
        <Box
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(utilization)}
          aria-label={`Credit utilization ${formatPercent(utilization)}`}
          sx={{
            position: "relative",
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(color, 0.18),
            // Generous hit target for the tooltip without a taller mark.
            my: 0.75,
            "&::before": { content: '""', position: "absolute", inset: "-6px 0" },
          }}
        >
          <Box
            sx={{
              width: `${fill}%`,
              height: "100%",
              borderRadius: 4,
              bgcolor: color,
              transition: "width 300ms ease-out",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: `${UTILIZATION_FAIR_THRESHOLD}%`,
              top: -2,
              bottom: -2,
              width: 2,
              borderRadius: 1,
              bgcolor: "text.secondary",
              opacity: 0.5,
            }}
          />
        </Box>
      </Tooltip>
      {!compact && (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(owed)} of {formatCurrency(creditLimit)} · {formatPercent(utilization)}
          </Typography>
          <UtilizationStatus percent={utilization} />
        </Stack>
      )}
    </Box>
  );
}
