"use client";

import { useMemo } from "react";
import { useTheme } from "@mui/material";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import { ChartCard } from "@/components/dashboard/chart-card";
import { getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatChartDate, formatCurrency, formatCurrencyAxis } from "@/lib/utils/format";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import type { ForecastPoint } from "@/lib/forecasting";

type ForecastChartProps = {
  points: ForecastPoint[];
  loading?: boolean;
};

export function ForecastChart({ points, loading = false }: ForecastChartProps) {
  const theme = useTheme();
  const plotHeight = useChartPlotHeight();

  const { chartData, forecastStartLabel } = useMemo(() => {
    const firstProjected = points.find((point) => point.isProjected);
    const lastHistorical = [...points].reverse().find((point) => !point.isProjected);
    const pivot = lastHistorical?.date ?? firstProjected?.date ?? null;

    const data = points.map((point) => ({
      ...point,
      label: formatChartDate(point.date),
      historicalBalance: point.isProjected ? null : point.balance,
      projectedBalance:
        point.isProjected || (pivot && point.date === pivot) ? point.balance : null,
    }));

    return {
      chartData: data,
      forecastStartLabel: firstProjected ? formatChartDate(firstProjected.date) : null,
    };
  }, [points]);

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Balance Forecast"
      subtitle="Historical balance (solid) and projected balance (dashed)"
      isEmpty={isEmpty}
      emptyMessage="Add transactions to see your balance forecast."
    >
      {loading && !isEmpty ? (
        <ChartPlotShimmer variant="line" height={plotHeight} />
      ) : (
        <ResponsiveContainer width="100%" height={plotHeight}>
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={getChartGridStroke(theme)}
              vertical={false}
            />
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
              tickFormatter={(value) => formatCurrencyAxis(Number(value))}
              width={84}
            />
            <Tooltip
              formatter={(value, name) => {
                if (value == null || value === "") return ["—", String(name)];
                return [
                  formatCurrency(typeof value === "number" ? value : Number(value)),
                  String(name),
                ];
              }}
              labelFormatter={(label) => String(label)}
              contentStyle={getChartTooltipStyle(theme)}
            />
            <Legend />
            {forecastStartLabel && (
              <ReferenceLine
                x={forecastStartLabel}
                stroke={theme.palette.warning.main}
                strokeDasharray="4 4"
                label={{ value: "Forecast", fill: theme.palette.warning.main, fontSize: 11 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="historicalBalance"
              name="Historical"
              stroke={theme.palette.primary.main}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projectedBalance"
              name="Projected"
              stroke={theme.palette.warning.main}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
