"use client";

import { useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import {
  currencyAxisTick,
  getAxisTick,
  getChartGridStroke,
  getChartTooltipStyle,
} from "@/lib/theme/chart-styles";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import { useMounted } from "@/hooks/use-mounted";
import type { MonthlySavingsPoint } from "@/lib/types";

type SavingsTrendChartProps = {
  data: MonthlySavingsPoint[];
};

/**
 * Net savings per month as bars diverging from zero: months you kept money rise in green,
 * months you overspent drop in red. The zero line is the reference, so sign reads instantly.
 */
export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
  const theme = useTheme();
  const mounted = useMounted();
  const plotHeight = useChartPlotHeight();

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  const isEmpty = chartData.length === 0;
  const positiveMonths = data.filter((point) => point.savings > 0).length;

  return (
    <ChartCard
      title="Monthly savings"
      subtitle={
        isEmpty
          ? "Net savings (income minus expenses) by month"
          : `Income minus expenses · you saved in ${positiveMonths} of ${data.length} months`
      }
      isEmpty={isEmpty}
    >
      {!mounted && !isEmpty ? (
        <ChartPlotShimmer variant="bar" height={plotHeight} />
      ) : mounted && !isEmpty ? (
        <ResponsiveContainer width="100%" height={plotHeight} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={getChartGridStroke(theme)} vertical={false} />
            <XAxis
              dataKey="label"
              tick={getAxisTick(theme)}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              tick={getAxisTick(theme)}
              axisLine={false}
              tickLine={false}
              tickFormatter={currencyAxisTick}
              width={76}
            />
            <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeOpacity={0.5} />
            <Tooltip
              formatter={(value) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return [formatCurrency(num), num >= 0 ? "Saved" : "Overspent"];
              }}
              contentStyle={getChartTooltipStyle(theme)}
              cursor={{ fill: theme.palette.action.hover }}
            />
            <Bar dataKey="savings" name="Savings" maxBarSize={36} radius={[4, 4, 4, 4]}>
              {chartData.map((point) => (
                <Cell
                  key={point.month}
                  fill={point.savings >= 0 ? theme.palette.success.main : theme.palette.error.main}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </ChartCard>
  );
}
