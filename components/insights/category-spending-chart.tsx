"use client";

import { useEffect, useState } from "react";
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
import { formatCurrency } from "@/lib/format";
import { CHART_AREA_HEIGHT } from "@/lib/layout-constants";

type CategorySpendingChartProps = {
  data: Array<{ category: string; amount: number }>;
};

const BAR_COLORS = ["#1a73e8", "#34a853", "#f9ab00", "#ea4335", "#9334e6", "#5f6368"];

export function CategorySpendingChart({ data }: CategorySpendingChartProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.slice(0, 6);
  const isEmpty = chartData.length === 0;

  return (
    <ChartCard
      title="Spending by Category"
      subtitle="Top expense categories"
      isEmpty={isEmpty}
      emptyMessage="No expense categories to chart yet."
    >
      {!mounted && !isEmpty ? (
        <Skeleton variant="rounded" sx={{ width: "100%", height: CHART_AREA_HEIGHT }} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: theme.palette.divider }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={100}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: theme.palette.divider }}
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
            <Bar dataKey="amount" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
