"use client";

import { useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import type { MonthlyChartPoint } from "@/lib/types";

type MonthlyIncomeExpenseChartProps = {
  data: MonthlyChartPoint[];
  chartReady?: boolean;
};

export function MonthlyIncomeExpenseChart({
  data,
  chartReady = true,
}: MonthlyIncomeExpenseChartProps) {
  const theme = useTheme();
  const plotHeight = useChartPlotHeight();

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Monthly Income vs Expenses"
      subtitle="Totals grouped by calendar month"
      isEmpty={isEmpty}
    >
      {!chartReady && !isEmpty ? (
        <ChartPlotShimmer variant="bar" height={plotHeight} />
      ) : (
        <ResponsiveContainer width="100%" height={plotHeight}>
          <BarChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }} barGap={6}>
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
              contentStyle={getChartTooltipStyle(theme)}
              cursor={{ fill: theme.palette.action.hover }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill={theme.palette.success.main}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={theme.palette.error.main}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
