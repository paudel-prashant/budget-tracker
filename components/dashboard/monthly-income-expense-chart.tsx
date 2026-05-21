"use client";

import { useTheme } from "@mui/material";
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
import { formatCurrency, formatMonth } from "@/lib/format";
import type { MonthlyChartPoint } from "@/lib/types";

type MonthlyIncomeExpenseChartProps = {
  data: MonthlyChartPoint[];
};

export function MonthlyIncomeExpenseChart({ data }: MonthlyIncomeExpenseChartProps) {
  const theme = useTheme();

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  return (
    <ChartCard
      title="Monthly Income vs Expenses"
      subtitle="Totals grouped by calendar month"
      isEmpty={chartData.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
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
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Income"
            fill={theme.palette.success.main}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill={theme.palette.error.main}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
