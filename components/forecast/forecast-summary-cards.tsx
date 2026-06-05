"use client";

import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { Box, Typography } from "@mui/material";
import { StatCard } from "@/components/shared/ui/stat-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { formatCurrency } from "@/lib/utils/format";
import type { ForecastConfidence } from "@/lib/forecasting";

type ForecastSummaryCardsProps = {
  currentBalance: number;
  projectedBalance: number;
  forecastChange: number;
  confidence: ForecastConfidence;
  dimmed?: boolean;
};

const CONFIDENCE_COLOR: Record<
  ForecastConfidence,
  "success" | "warning" | "error"
> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "error",
};

const CONFIDENCE_HINT: Record<ForecastConfidence, string> = {
  HIGH: "Stable income and spending patterns",
  MEDIUM: "Moderate spending variation",
  LOW: "Limited or volatile transaction history",
};

export function ForecastSummaryCards({
  currentBalance,
  projectedBalance,
  forecastChange,
  confidence,
  dimmed = false,
}: ForecastSummaryCardsProps) {
  const changeTint = forecastChange >= 0 ? "success" : "error";
  const changePrefix = forecastChange >= 0 ? "+" : "";

  return (
    <Box sx={{ opacity: dimmed ? 0.85 : 1, transition: "opacity 0.28s ease" }}>
      <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }} gap={2}>
        <StatCard
          title="Current Balance"
          value={formatCurrency(currentBalance)}
          icon={AccountBalanceWalletOutlinedIcon}
          tint="primary"
        />
        <StatCard
          title="Projected Balance"
          value={formatCurrency(projectedBalance)}
          icon={TrendingUpOutlinedIcon}
          tint={projectedBalance >= currentBalance ? "success" : "warning"}
        />
        <StatCard
          title="Forecast Change"
          value={`${changePrefix}${formatCurrency(forecastChange)}`}
          icon={forecastChange >= 0 ? TrendingUpOutlinedIcon : TrendingDownOutlinedIcon}
          tint={changeTint}
        />
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <StatCard
            title="Forecast Confidence"
            value={confidence}
            icon={VerifiedOutlinedIcon}
            tint={CONFIDENCE_COLOR[confidence]}
          />
          <Typography
            variant="caption"
            color={`${CONFIDENCE_COLOR[confidence]}.main`}
            sx={{ mt: 1, px: 0.5, lineHeight: 1.45 }}
          >
            {CONFIDENCE_HINT[confidence]}
          </Typography>
        </Box>
      </ResponsiveColumns>
    </Box>
  );
}
