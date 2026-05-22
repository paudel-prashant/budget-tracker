"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingFlatOutlinedIcon from "@mui/icons-material/TrendingFlatOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { DashboardInsightTone, DashboardInsights } from "@/lib/types";

type DashboardInsightsWidgetProps = {
  insights: DashboardInsights;
};

const toneAccent: Record<DashboardInsightTone, string> = {
  positive: "success.main",
  negative: "error.main",
  warning: "warning.main",
  neutral: "primary.main",
};

function TrendChip({
  direction,
  label,
}: {
  direction: DashboardInsights["savingsTrendDirection"];
  label?: string | null;
}) {
  const Icon =
    direction === "up"
      ? TrendingUpOutlinedIcon
      : direction === "down"
        ? TrendingDownOutlinedIcon
        : TrendingFlatOutlinedIcon;

  const color =
    direction === "up" ? "success.main" : direction === "down" ? "error.main" : "text.secondary";

  if (!label && direction === "flat") return null;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: "16px !important" }} />}
      label={label ?? (direction === "flat" ? "Stable" : direction === "up" ? "Up" : "Down")}
      size="small"
      variant="outlined"
      sx={{ borderColor: color, color, fontWeight: 600 }}
    />
  );
}

export function DashboardInsightsWidget({ insights }: DashboardInsightsWidgetProps) {
  const theme = useTheme();
  const accent = toneAccent[insights.tone];
  const totalFlow = insights.totalIncome + insights.totalExpenses;
  const incomeShare = totalFlow > 0 ? (insights.totalIncome / totalFlow) * 100 : 50;
  const expenseShare = totalFlow > 0 ? 100 - incomeShare : 50;

  const savingsTrendLabel =
    insights.savingsTrendChangePercent !== null
      ? `${insights.savingsTrendChangePercent > 0 ? "+" : ""}${formatPercent(insights.savingsTrendChangePercent)} vs prior month`
      : insights.latestMonthLabel
        ? `Latest: ${insights.latestMonthLabel}`
        : null;

  return (
    <SurfaceCard
      accentColor={accent}
      sx={{
        p: CARD_PADDING,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 50%)`,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ md: "stretch" }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              }}
            >
              <InsightsOutlinedIcon />
            </Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Insight highlight
            </Typography>
          </Stack>

          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75, letterSpacing: "-0.02em" }}>
            {insights.headline}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65, maxWidth: 560 }}>
            {insights.subline}
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {insights.topCategory && (
              <Chip
                size="small"
                label={`Top: ${insights.topCategory.category} (${insights.topCategory.percentOfTotal}%)`}
                sx={{ fontWeight: 600 }}
              />
            )}
            <TrendChip direction={insights.savingsTrendDirection} label={savingsTrendLabel} />
            {insights.incomeExpenseRatio !== null && (
              <Chip
                size="small"
                variant="outlined"
                label={`Income/expense ratio ${insights.incomeExpenseRatio.toFixed(2)}×`}
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", md: 280 },
            flexShrink: 0,
            p: 2,
            borderRadius: 2.5,
            border: 1,
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1.5 }}>
            Income vs expenses (all time)
          </Typography>

          <Stack spacing={1.25}>
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600} color="success.main">
                  Income
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {formatCurrency(insights.totalIncome)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={incomeShare}
                color="success"
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                }}
              />
            </Box>
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600} color="error.main">
                  Expenses
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {formatCurrency(insights.totalExpenses)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={expenseShare}
                color="error"
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                }}
              />
            </Box>
          </Stack>

          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 1.5, fontWeight: 600 }}
            color={insights.netBalance >= 0 ? "success.main" : "error.main"}
          >
            Net {insights.netBalance >= 0 ? "+" : ""}
            {formatCurrency(insights.netBalance)}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
        <Button
          component={NextLink}
          href="/insights"
          endIcon={<ArrowForwardOutlinedIcon />}
          size="small"
          sx={{ fontWeight: 600 }}
        >
          View full insights
        </Button>
      </Box>
    </SurfaceCard>
  );
}
