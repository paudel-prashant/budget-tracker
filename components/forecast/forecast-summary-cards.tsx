"use client";

import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { Box, Typography } from "@mui/material";
import { StatCard } from "@/components/shared/ui/stat-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { formatChartDate, formatCurrency } from "@/lib/utils/format";
import type { ForecastConfidence, ForecastEngineResult } from "@/lib/forecasting";

type ForecastSummaryCardsProps = {
  currentBalance: number;
  projectedBalance: number;
  forecastChange: number;
  confidence: ForecastConfidence;
  projectedRange?: ForecastEngineResult["projectedRange"];
  lowestPoint?: ForecastEngineResult["lowestPoint"];
  dimmed?: boolean;
};

function CardNote({ children, color = "text.secondary" }: { children: React.ReactNode; color?: string }) {
  return (
    <Typography variant="caption" color={color} sx={{ mt: 1, px: 0.5, lineHeight: 1.45 }}>
      {children}
    </Typography>
  );
}

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
  projectedRange,
  lowestPoint,
  dimmed = false,
}: ForecastSummaryCardsProps) {
  const showRange =
    projectedRange && projectedRange.high - projectedRange.low >= 1;
  // Only call out the low point when it dips meaningfully below where you start and end.
  const showLowest =
    lowestPoint &&
    lowestPoint.balance < Math.min(currentBalance, projectedBalance) - 1;
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
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <StatCard
            title="Projected Balance"
            value={formatCurrency(projectedBalance)}
            icon={TrendingUpOutlinedIcon}
            tint={projectedBalance >= currentBalance ? "success" : "warning"}
          />
          {showRange && (
            <CardNote>
              Likely range {formatCurrency(projectedRange.low)} – {formatCurrency(projectedRange.high)}
            </CardNote>
          )}
        </Box>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <StatCard
            title="Forecast Change"
            value={`${changePrefix}${formatCurrency(forecastChange)}`}
            icon={forecastChange >= 0 ? TrendingUpOutlinedIcon : TrendingDownOutlinedIcon}
            tint={changeTint}
          />
          {showLowest && (
            <CardNote color={lowestPoint.balance < 0 ? "error.main" : "text.secondary"}>
              Lowest point {formatCurrency(lowestPoint.balance)} on {formatChartDate(lowestPoint.date)}
            </CardNote>
          )}
        </Box>
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
