"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatCurrency, formatMonth, formatPercent } from "@/lib/utils/format";
import type { NetWorthHistoryPoint } from "@/lib/types";

type NetWorthGrowthChartProps = {
  data: NetWorthHistoryPoint[];
};

export function NetWorthGrowthChart({ data }: NetWorthGrowthChartProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Net worth over time"
      subtitle="Monthly net worth and savings rate from your records"
      isEmpty={isEmpty}
      emptyMessage="Add assets and liabilities to see net worth growth."
    >
      {!mounted && !isEmpty ? (
        <ChartPlotShimmer variant="line" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={getChartGridStroke(theme)} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={76}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Savings rate") {
                  const num = typeof value === "number" ? value : Number(value ?? 0);
                  return num === 0 ? "—" : formatPercent(num);
                }
                return formatCurrency(typeof value === "number" ? value : Number(value ?? 0));
              }}
              contentStyle={getChartTooltipStyle(theme)}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="netWorth"
              name="Net worth"
              stroke={theme.palette.primary.main}
              fill="url(#netWorthFill)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
