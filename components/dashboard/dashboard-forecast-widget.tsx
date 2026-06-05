"use client";

import { useId, useMemo } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { WidgetFooter, WidgetLinkButton } from "@/components/dashboard/widget-actions";
import { getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { useForecast } from "@/hooks/use-forecast";
import { formatChartDate, formatCurrency } from "@/lib/utils/format";
import type { ForecastConfidence, ForecastInsightSeverity } from "@/lib/forecasting";
import type { SvgIconComponent } from "@mui/icons-material";

const CONFIDENCE_COLOR: Record<
  ForecastConfidence,
  "success" | "warning" | "error"
> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "error",
};

function insightSeverity(severity: ForecastInsightSeverity) {
  switch (severity) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

function MetricTile({
  label,
  value,
  icon: Icon,
  tint,
  valueColor,
  dimmed,
}: {
  label: string;
  value: string;
  icon: SvgIconComponent;
  tint: "primary" | "success" | "error" | "warning";
  valueColor?: string;
  dimmed?: boolean;
}) {
  const theme = useTheme();
  const palette = theme.palette[tint];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: 1,
        borderColor: alpha(palette.main, 0.18),
        bgcolor: alpha(palette.main, 0.06),
        opacity: dimmed ? 0.85 : 1,
        transition: "opacity 0.28s ease",
        height: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${alpha(palette.main, 0.22)} 0%, ${alpha(palette.main, 0.08)} 100%)`,
            color: palette.main,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
            {label}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            sx={{ color: valueColor ?? "text.primary", lineHeight: 1.25 }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ForecastSparkline({
  points,
  strokeColor,
}: {
  points: Array<{ label: string; value: number }>;
  strokeColor: string;
}) {
  const theme = useTheme();
  const gradientId = useId().replace(/:/g, "");

  if (points.length === 0) {
    return (
      <Box
        sx={{
          height: 88,
          borderRadius: 2.5,
          border: 1,
          borderColor: "divider",
          borderStyle: "dashed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No trend data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        display="block"
        sx={{ mb: 0.75, px: 0.25 }}
      >
        Balance trend
      </Typography>
      <Box
        sx={{
          height: 88,
          borderRadius: 2.5,
          border: 1,
          borderColor: alpha(strokeColor, 0.14),
          bgcolor: alpha(theme.palette.background.paper, 0.65),
          overflow: "hidden",
          px: 0.5,
          pt: 0.5,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={getChartTooltipStyle(theme)}
              formatter={(value) => {
                if (value == null || value === "") return ["—", "Balance"];
                return [
                  formatCurrency(typeof value === "number" ? value : Number(value)),
                  "Balance",
                ];
              }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ? String(payload[0].payload.label) : ""
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.25}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export function DashboardForecastWidget() {
  const theme = useTheme();
  const { forecast, loading, error } = useForecast({ initialTimeframe: "30d" });

  const sparklinePoints = useMemo(
    () =>
      forecast?.forecastPoints.map((point) => ({
        label: formatChartDate(point.date),
        value: point.balance,
      })) ?? [],
    [forecast?.forecastPoints]
  );

  if (loading && !forecast) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error.main">
        {error}
      </Typography>
    );
  }

  if (
    !forecast ||
    (forecast.emptyStates.includes("no_history") && forecast.currentBalance === 0)
  ) {
    return (
      <Stack
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        sx={{ py: 1 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
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
              flexShrink: 0,
            }}
          >
            <TimelineOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Add transactions to see a 30-day cash flow projection on your dashboard.
          </Typography>
        </Stack>
        <WidgetLinkButton href="/forecast">Open forecast</WidgetLinkButton>
      </Stack>
    );
  }

  const changePositive = forecast.forecastChange >= 0;
  const changeColor = changePositive ? "success.main" : "error.main";
  const changePrefix = changePositive ? "+" : "";
  const topInsight = forecast.insights[0];
  const confidenceColor = CONFIDENCE_COLOR[forecast.confidence];
  const insightTint = topInsight ? insightSeverity(topInsight.severity) : "info";
  const trendGradient = changePositive
    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, transparent 55%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, transparent 55%)`;
  const sparklineColor = changePositive
    ? theme.palette.success.main
    : theme.palette.error.main;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        borderRadius: 2.5,
        p: { xs: 1.5, sm: 2 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 45%), ${trendGradient}`,
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.12),
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ResponsiveColumns columns={{ xs: 1, sm: 3 }} gap={1.5}>
            <MetricTile
              label="Current balance"
              value={formatCurrency(forecast.currentBalance)}
              icon={AccountBalanceWalletOutlinedIcon}
              tint="primary"
              dimmed={loading}
            />
            <MetricTile
              label="Projected (30d)"
              value={formatCurrency(forecast.projectedBalance)}
              icon={ShowChartOutlinedIcon}
              tint={forecast.projectedBalance >= forecast.currentBalance ? "success" : "warning"}
              dimmed={loading}
            />
            <MetricTile
              label="Forecast change"
              value={`${changePrefix}${formatCurrency(forecast.forecastChange)}`}
              icon={changePositive ? TrendingUpOutlinedIcon : TrendingDownOutlinedIcon}
              tint={changePositive ? "success" : "error"}
              valueColor={changeColor}
              dimmed={loading}
            />
          </ResponsiveColumns>
        </Box>

        <Box sx={{ width: { xs: "100%", md: 200 }, flexShrink: 0 }}>
          <ForecastSparkline points={sparklinePoints} strokeColor={sparklineColor} />
        </Box>
      </Stack>

      {topInsight && (
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="flex-start"
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette[insightTint].main, 0.08),
            borderLeft: 3,
            borderColor: `${insightTint}.main`,
          }}
        >
          <AutoAwesomeOutlinedIcon
            sx={{ fontSize: 18, color: `${insightTint}.main`, mt: 0.15, flexShrink: 0 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {topInsight.message}
          </Typography>
        </Stack>
      )}

      <WidgetFooter sx={{ justifyContent: "space-between" }}>
        <Chip
          label={`${forecast.confidence} confidence`}
          size="small"
          color={confidenceColor}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <WidgetLinkButton href="/forecast">View full forecast</WidgetLinkButton>
      </WidgetFooter>
    </Box>
  );
}
