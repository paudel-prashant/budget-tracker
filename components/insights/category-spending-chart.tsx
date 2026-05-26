"use client";

import { Skeleton, useTheme } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { CHART_PALETTE, getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatCurrency } from "@/lib/utils/format";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import { useMounted } from "@/hooks/use-mounted";

type CategorySpendingChartProps = {
  data: Array<{ category: string; amount: number }>;
};

export function CategorySpendingChart({ data }: CategorySpendingChartProps) {
  const theme = useTheme();
  const mounted = useMounted();
  const plotHeight = useChartPlotHeight();

  const chartData = data.slice(0, 8);
  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Spending by Category"
      subtitle="Top expense categories"
      isEmpty={isEmpty}
      emptyMessage="No expense categories to chart yet."
    >
      {!mounted && !isEmpty ? (
        <Skeleton variant="rounded" sx={{ width: "100%", height: plotHeight, borderRadius: 2 }} />
      ) : mounted && !isEmpty ? (
        <ResponsiveContainer width="100%" height={plotHeight} minWidth={0}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={getChartGridStroke(theme)}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={108}
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) =>
                formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
              }
              contentStyle={getChartTooltipStyle(theme)}
              cursor={{ fill: theme.palette.action.hover }}
            />
            <Bar dataKey="amount" name="Spent" radius={[0, 6, 6, 0]} maxBarSize={32}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </ChartCard>
  );
}
