"use client";

import { Skeleton, useTheme } from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { formatChartDate, formatCurrency } from "@/lib/format";
import { CHART_AREA_HEIGHT } from "@/lib/layout-constants";
import type { BalanceChartPoint } from "@/lib/types";

type BalanceLineChartProps = {
  data: BalanceChartPoint[];
  chartReady?: boolean;
};

export function BalanceLineChart({ data, chartReady = true }: BalanceLineChartProps) {
  const theme = useTheme();

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
        <Skeleton variant="rounded" sx={{ width: "100%", height: CHART_AREA_HEIGHT }} />
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            axisLine={{ stroke: theme.palette.divider }}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            axisLine={{ stroke: theme.palette.divider }}
            tickFormatter={(value) => `$${value}`}
            width={72}
          />
          <Tooltip
            formatter={(value) =>
              formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
            }
            labelFormatter={(label) => String(label)}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={{ r: 3, fill: theme.palette.primary.main }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
