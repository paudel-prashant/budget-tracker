"use client";

import { useMemo } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import type { ChartTooltipProps } from "@/lib/theme/chart-styles";
import {
  currencyAxisTick,
  getAxisTick,
  getChartGridStroke,
  getChartTooltipStyle,
} from "@/lib/theme/chart-styles";
import { formatChartDate, formatCurrency, formatMonth } from "@/lib/utils/format";
import { buildCumulativeFlow } from "@/lib/domain/daily-series";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

type MonthlyIncomeExpenseChartProps = {
  data: MonthlyChartPoint[];
  /** Daily points for the single-month "pace" view. */
  dailyData?: BalanceChartPoint[];
  chartReady?: boolean;
};

type Row = { label: string; income: number; expenses: number };

function FlowTooltip({ active, payload, label, title }: ChartTooltipProps & { title?: string }) {
  const theme = useTheme();
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  const net = row.income - row.expenses;

  return (
    <Box sx={getChartTooltipStyle(theme)}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        {title ? `${title} · ${label}` : label}
      </Typography>
      <Stack spacing={0.25}>
        <LegendRow color={theme.palette.success.main} label="Income" value={formatCurrency(row.income)} />
        <LegendRow color={theme.palette.error.main} label="Spent" value={formatCurrency(row.expenses)} />
        <Typography variant="caption" fontWeight={700} sx={{ pt: 0.5 }}>
          {net >= 0 ? "Ahead by " : "Behind by "}
          {formatCurrency(Math.abs(net))}
        </Typography>
      </Stack>
    </Box>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Income vs spending. Across several months: grouped monthly bars. Within a single month,
 * two bars say nothing a pair of numbers wouldn't — so show the running totals instead,
 * where the gap between the lines is how far ahead (or behind) you are.
 */
export function MonthlyIncomeExpenseChart({
  data,
  dailyData = [],
  chartReady = true,
}: MonthlyIncomeExpenseChartProps) {
  const theme = useTheme();
  const plotHeight = useChartPlotHeight();
  const incomeColor = theme.palette.success.main;
  const expenseColor = theme.palette.error.main;
  const usePace = data.length < 2 && dailyData.length > 1;

  const monthlyRows: Row[] = useMemo(
    () => data.map((point) => ({ label: formatMonth(point.month), income: point.income, expenses: point.expenses })),
    [data]
  );
  const paceRows: Row[] = useMemo(
    () =>
      buildCumulativeFlow(dailyData).map((point) => ({
        label: formatChartDate(point.date),
        income: point.income,
        expenses: point.expenses,
      })),
    [dailyData]
  );

  const isEmpty = usePace ? paceRows.length === 0 : monthlyRows.length === 0;
  const lastPace = paceRows[paceRows.length - 1];
  const net = lastPace ? lastPace.income - lastPace.expenses : 0;

  const legend = (
    <Legend
      verticalAlign="bottom"
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
      // Legend text stays in text ink; the dot carries the series colour.
      formatter={(value) => <span style={{ color: theme.palette.text.secondary }}>{value}</span>}
    />
  );

  const axes = (
    <>
      <CartesianGrid stroke={getChartGridStroke(theme)} vertical={false} />
      <XAxis
        dataKey="label"
        tick={getAxisTick(theme)}
        axisLine={false}
        tickLine={false}
        tickMargin={10}
        interval="preserveStartEnd"
        minTickGap={28}
      />
      <YAxis tick={getAxisTick(theme)} axisLine={false} tickLine={false} tickFormatter={currencyAxisTick} width={64} />
    </>
  );

  return (
    <ChartCard
      title={usePace ? "Income vs spending pace" : "Monthly income vs expenses"}
      subtitle={
        usePace && lastPace
          ? `Running totals this period · ${net >= 0 ? "ahead by" : "behind by"} ${formatCurrency(Math.abs(net))}`
          : "Totals grouped by calendar month"
      }
      isEmpty={isEmpty}
    >
      {!chartReady && !isEmpty ? (
        <ChartPlotShimmer variant={usePace ? "line" : "bar"} height={plotHeight} />
      ) : usePace ? (
        <ResponsiveContainer width="100%" height={plotHeight}>
          <LineChart data={paceRows} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            {axes}
            <Tooltip
              content={<FlowTooltip title="So far" />}
              cursor={{ stroke: theme.palette.text.secondary, strokeWidth: 1, strokeOpacity: 0.4 }}
            />
            {legend}
            <Line
              type="stepAfter"
              dataKey="income"
              name="Income"
              stroke={incomeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="expenses"
              name="Spent"
              stroke={expenseColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={plotHeight}>
          <BarChart data={monthlyRows} margin={{ top: 12, right: 16, left: 4, bottom: 4 }} barGap={2} barCategoryGap="28%">
            {axes}
            <Tooltip content={<FlowTooltip />} cursor={{ fill: theme.palette.action.hover }} />
            {legend}
            <Bar dataKey="income" name="Income" fill={incomeColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" name="Expenses" fill={expenseColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
