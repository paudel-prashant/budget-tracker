"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
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
import type { MonthlyReportDailyPoint } from "@/lib/types";

type ReportDailySpendingChartProps = {
  data: MonthlyReportDailyPoint[];
};

export function ReportDailySpendingChart({ data }: ReportDailySpendingChartProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.date),
  }));

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Daily spending"
      subtitle="Expense totals by day in this month"
      isEmpty={isEmpty}
      emptyMessage="No expenses recorded this month."
    >
      {!mounted && !isEmpty ? (
        <ChartPlotShimmer variant="line" height={CHART_AREA_HEIGHT} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="reportDailyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.error.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.error.main} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={getChartGridStroke(theme)} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
              width={72}
            />
            <Tooltip
              formatter={(value) =>
                formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
              }
              contentStyle={getChartTooltipStyle(theme)}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Spent"
              stroke={theme.palette.error.main}
              fill="url(#reportDailyFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
