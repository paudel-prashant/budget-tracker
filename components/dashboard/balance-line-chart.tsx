"use client";

import { Skeleton, useTheme } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatChartDate, formatCurrency } from "@/lib/utils/format";
import { CHART_AREA_HEIGHT } from "@/lib/config/layout-constants";
import type { BalanceChartPoint } from "@/lib/types";

type BalanceLineChartProps = {
  data: BalanceChartPoint[];
  chartReady?: boolean;
};

export function BalanceLineChart({ data, chartReady = true }: BalanceLineChartProps) {
  const theme = useTheme();
  const gradientId = "balanceAreaGradient";

  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.date),
  }));

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Balance Over Time"
      subtitle="Cumulative net balance by day"
      isEmpty={isEmpty}
    >
      {!chartReady && !isEmpty ? (
        <Skeleton variant="rounded" sx={{ width: "100%", height: CHART_AREA_HEIGHT, borderRadius: 2 }} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={getChartGridStroke(theme)} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
              width={76}
            />
            <Tooltip
              formatter={(value) =>
                formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
              }
              labelFormatter={(label) => String(label)}
              contentStyle={getChartTooltipStyle(theme)}
              cursor={{ stroke: theme.palette.primary.main, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke={theme.palette.primary.main}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: theme.palette.primary.main, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: theme.palette.background.paper }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
