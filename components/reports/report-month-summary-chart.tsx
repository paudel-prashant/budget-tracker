"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
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
import { getChartGridStroke, getChartTooltipStyle } from "@/lib/theme/chart-styles";
import { formatCurrency } from "@/lib/utils/format";
import { CHART_AREA_HEIGHT } from "@/lib/config/layout-constants";

type ReportMonthSummaryChartProps = {
  monthLabel: string;
  income: number;
  expenses: number;
};

export function ReportMonthSummaryChart({
  monthLabel,
  income,
  expenses,
}: ReportMonthSummaryChartProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [
    { name: "Income", value: income, fill: theme.palette.success.main },
    { name: "Expenses", value: expenses, fill: theme.palette.error.main },
  ];

  const isEmpty = income === 0 && expenses === 0;

  return (
    <ChartCard
      title="Income vs expenses"
      subtitle={monthLabel}
      isEmpty={isEmpty}
      emptyMessage="No income or expenses this month."
    >
      {!mounted && !isEmpty ? (
        <ChartPlotShimmer variant="bar" height={CHART_AREA_HEIGHT} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={getChartGridStroke(theme)} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
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
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
