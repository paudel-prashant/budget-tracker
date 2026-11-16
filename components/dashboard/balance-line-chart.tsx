"use client";

import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ChartPlotShimmer } from "@/components/shared/ui/chart-shimmer";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
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
import { formatChartDate, formatCurrency } from "@/lib/utils/format";
import { densifyDailyBalance } from "@/lib/domain/daily-series";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import type { BalanceChartPoint } from "@/lib/types";

type BalanceLineChartProps = {
  data: BalanceChartPoint[];
  chartReady?: boolean;
};

type Row = BalanceChartPoint & { label: string };

function BalanceTooltip({ active, payload }: ChartTooltipProps) {
  const theme = useTheme();
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  const moved = (row.income ?? 0) > 0 || (row.expenses ?? 0) > 0;

  return (
    <Box sx={getChartTooltipStyle(theme)}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {row.label}
      </Typography>
      <Typography variant="subtitle2" fontWeight={700}>
        {formatCurrency(row.balance)}
      </Typography>
      {moved ? (
        <Typography variant="caption" color="text.secondary">
          {(row.income ?? 0) > 0 && `+${formatCurrency(row.income ?? 0)} in`}
          {(row.income ?? 0) > 0 && (row.expenses ?? 0) > 0 && " · "}
          {(row.expenses ?? 0) > 0 && `−${formatCurrency(row.expenses ?? 0)} out`}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No transactions
        </Typography>
      )}
    </Box>
  );
}

/**
 * Running balance across every calendar day in the range. Drawn as steps because a balance
 * only changes when money moves — a smooth curve would invent values between transactions.
 */
export function BalanceLineChart({ data, chartReady = true }: BalanceLineChartProps) {
  const theme = useTheme();
  const plotHeight = useChartPlotHeight();
  const gradientId = "balanceAreaGradient";
  const stroke = theme.palette.primary.main;

  const { rows, last, lowest, change } = useMemo(() => {
    const dense: Row[] = densifyDailyBalance(data).map((point) => ({
      ...point,
      label: formatChartDate(point.date),
    }));
    const lastRow = dense[dense.length - 1];
    const lowestRow = dense.reduce<Row | null>(
      (min, row) => (!min || row.balance < min.balance ? row : min),
      null
    );
    return {
      rows: dense,
      last: lastRow,
      lowest: lowestRow,
      change: dense.length > 0 ? lastRow.balance - dense[0].balance : 0,
    };
  }, [data]);

  const isEmpty = rows.length === 0;
  const showLowest =
    lowest && last && lowest.date !== last.date && lowest.date !== rows[0]?.date && lowest.balance < last.balance;
  const crossesZero = rows.some((row) => row.balance < 0);

  return (
    <ChartCard
      title="Balance over time"
      subtitle={
        isEmpty
          ? "Cumulative net balance by day"
          : `${change >= 0 ? "Up" : "Down"} ${formatCurrency(Math.abs(change))} since ${rows[0].label}`
      }
      isEmpty={isEmpty}
    >
      {!chartReady && !isEmpty ? (
        <ChartPlotShimmer variant="line" height={plotHeight} />
      ) : (
        <ResponsiveContainer width="100%" height={plotHeight}>
          <AreaChart data={rows} margin={{ top: 24, right: 28, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <YAxis
              tick={getAxisTick(theme)}
              axisLine={false}
              tickLine={false}
              tickFormatter={currencyAxisTick}
              width={64}
            />
            {crossesZero && <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeOpacity={0.5} />}
            <Tooltip
              content={<BalanceTooltip />}
              cursor={{ stroke: theme.palette.text.secondary, strokeWidth: 1, strokeOpacity: 0.4 }}
            />
            <Area
              type="stepAfter"
              dataKey="balance"
              name="Balance"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
              isAnimationActive={false}
            />
            {showLowest && lowest && (
              <ReferenceDot
                x={lowest.label}
                y={lowest.balance}
                r={4}
                fill={theme.palette.background.paper}
                stroke={stroke}
                strokeWidth={2}
                label={{
                  value: `Low ${currencyAxisTick(lowest.balance)}`,
                  position: "bottom",
                  fill: theme.palette.text.secondary,
                  fontSize: 11,
                }}
              />
            )}
            {last && (
              <ReferenceDot
                x={last.label}
                y={last.balance}
                r={5}
                fill={stroke}
                stroke={theme.palette.background.paper}
                strokeWidth={2}
                label={{
                  value: formatCurrency(last.balance),
                  position: "top",
                  fill: theme.palette.text.primary,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
