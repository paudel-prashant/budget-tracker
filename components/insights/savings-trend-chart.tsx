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
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import { useMounted } from "@/hooks/use-mounted";
import type { MonthlySavingsPoint } from "@/lib/types";

type SavingsTrendChartProps = {
  data: MonthlySavingsPoint[];
};

export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
  const theme = useTheme();
  const mounted = useMounted();
  const plotHeight = useChartPlotHeight();
  const gradientId = "savingsAreaGradient";

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Monthly Savings Trend"
      subtitle="Net savings (income minus expenses) by month"
      isEmpty={isEmpty}
    >
      {!mounted && !isEmpty ? (
        <Skeleton variant="rounded" sx={{ width: "100%", height: plotHeight, borderRadius: 2 }} />
      ) : mounted && !isEmpty ? (
        <ResponsiveContainer width="100%" height={plotHeight} minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={0.4} />
                <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0} />
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
              formatter={(value, name) => {
                const label =
                  name === "savings" ? "Savings" : name === "income" ? "Income" : "Expenses";
                return [
                  formatCurrency(typeof value === "number" ? value : Number(value ?? 0)),
                  label,
                ];
              }}
              contentStyle={getChartTooltipStyle(theme)}
              cursor={{ stroke: theme.palette.success.main, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="savings"
              name="savings"
              stroke={theme.palette.success.main}
              fill={`url(#${gradientId})`}
              strokeWidth={2.5}
              activeDot={{ r: 6, strokeWidth: 2, stroke: theme.palette.background.paper }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </ChartCard>
  );
}
