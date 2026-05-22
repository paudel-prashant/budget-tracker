"use client";

import { useEffect, useState } from "react";
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
import { formatCurrency, formatMonth } from "@/lib/format";
import { CHART_AREA_HEIGHT } from "@/lib/layout-constants";
import type { MonthlySavingsPoint } from "@/lib/types";

type SavingsTrendChartProps = {
  data: MonthlySavingsPoint[];
};

export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
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
      title="Monthly Savings Trend"
      subtitle="Net savings (income minus expenses) by month"
      isEmpty={isEmpty}
    >
      {!mounted && !isEmpty ? (
        <Skeleton variant="rounded" sx={{ width: "100%", height: CHART_AREA_HEIGHT }} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value, name) => {
                const label =
                  name === "savings"
                    ? "Savings"
                    : name === "income"
                      ? "Income"
                      : "Expenses";
                return [
                  formatCurrency(typeof value === "number" ? value : Number(value ?? 0)),
                  label,
                ];
              }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="savings"
              name="savings"
              stroke={theme.palette.primary.main}
              fill="url(#savingsGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
