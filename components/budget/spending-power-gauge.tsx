"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography, alpha, useTheme } from "@mui/material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CategoryIcon } from "@/components/shared/ui/category-icon";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { summarizeSpendingPower } from "@/lib/domain/spending-power";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetWithProgress } from "@/lib/types";

type SpendingPowerGaugeProps = {
  budgets: BudgetWithProgress[];
  month: number;
  year: number;
};

const TICKS = 41;
const CX = 120;
const CY = 118;
const R_INNER = 86;
const R_OUTER = 108;
const R_PACE = 114;

function polar(radius: number, angle: number) {
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

/** Red → amber → green along the arc, like a fuel gauge running from empty to full. */
function tickColor(position: number, palette: { error: string; warning: string; success: string }) {
  if (position < 0.2) return palette.error;
  if (position < 0.45) return palette.warning;
  return palette.success;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color={color} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

export function SpendingPowerGauge({ budgets, month, year }: SpendingPowerGaugeProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const summary = useMemo(
    () =>
      summarizeSpendingPower(budgets, month, year, new Date(), (value) => formatCurrency(value)),
    [budgets, month, year]
  );

  // Ticks light up one after another on mount and whenever the month changes.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, [summary.remainingFraction, month, year]);

  const palette = {
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
  };
  const litTicks = Math.round(summary.remainingFraction * (TICKS - 1)) + (summary.remaining > 0 ? 1 : 0);
  const moodColor =
    summary.mood === "over" || summary.mood === "fast"
      ? palette.error
      : summary.mood === "pace"
        ? palette.warning
        : palette.success;

  const paceAngle = summary.paceFraction !== null ? Math.PI - summary.paceFraction * Math.PI : null;

  return (
    <SurfaceCard accentColor={moodColor} sx={{ p: CARD_PADDING }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2, md: 4 }}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box sx={{ position: "relative", width: "100%", maxWidth: 340, mx: { xs: "auto", md: 0 } }}>
          <svg
            viewBox="0 0 240 132"
            width="100%"
            role="img"
            aria-label={`${formatCurrency(summary.remaining)} of ${formatCurrency(summary.totalLimit)} left to spend`}
          >
            {Array.from({ length: TICKS }, (_, i) => {
              const position = i / (TICKS - 1);
              const angle = Math.PI - position * Math.PI;
              const lit = i < litTicks;
              // Every fifth tick is longer, like a real dial.
              const major = i % 5 === 0;
              const start = polar(major ? R_INNER - 6 : R_INNER, angle);
              const end = polar(R_OUTER, angle);
              return (
                <line
                  key={i}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={lit ? tickColor(position, palette) : alpha(theme.palette.text.primary, 0.12)}
                  strokeWidth={major ? 4 : 3}
                  strokeLinecap="round"
                  style={{
                    opacity: lit && !revealed && !reducedMotion ? 0.15 : 1,
                    transition: reducedMotion
                      ? undefined
                      : `opacity 220ms ease ${i * 18}ms, stroke 220ms ease ${i * 18}ms`,
                  }}
                />
              );
            })}

            {paceAngle !== null && (
              <g>
                <line
                  {...(() => {
                    const a = polar(R_INNER - 10, paceAngle);
                    const b = polar(R_PACE, paceAngle);
                    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
                  })()}
                  stroke={theme.palette.text.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={polar(R_PACE + 3, paceAngle).x}
                  cy={polar(R_PACE + 3, paceAngle).y}
                  r={3.5}
                  fill={theme.palette.text.primary}
                />
              </g>
            )}

            <text x={CX - R_OUTER + 2} y={CY + 13} fontSize={9} fill={theme.palette.text.secondary} textAnchor="middle">
              $0
            </text>
            <text x={CX + R_OUTER - 2} y={CY + 13} fontSize={9} fill={theme.palette.text.secondary} textAnchor="middle">
              Full
            </text>
          </svg>

          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: { xs: 6, sm: 10 },
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ lineHeight: 1.1, fontSize: { xs: "1.6rem", sm: "2rem" } }}
              color={summary.remaining < 0 ? "error.main" : "text.primary"}
            >
              {formatCurrency(Math.abs(summary.remaining))}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.remaining < 0 ? "over your budgets" : "left to spend"}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Spending power
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: moodColor, lineHeight: 1.3 }}>
              {summary.headline}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {summary.detail}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 2,
            }}
          >
            <Stat label="Budgeted" value={formatCurrency(summary.totalLimit)} />
            <Stat label="Spent" value={formatCurrency(summary.spent)} color="error.main" />
            <Stat
              label={summary.daysLeft > 0 ? "Per day" : "Unspent"}
              value={
                summary.daysLeft > 0
                  ? formatCurrency(Math.max(0, summary.dailyAllowance))
                  : formatCurrency(Math.max(0, summary.remaining))
              }
              color="success.main"
            />
          </Box>

          {summary.watchList.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                Keep an eye on
              </Typography>
              {summary.watchList.map((budget) => (
                <Chip
                  key={budget.id}
                  size="small"
                  variant="outlined"
                  color={budget.isOverBudget ? "error" : "warning"}
                  icon={<CategoryIcon category={budget.category} size="small" sx={{ ml: 0.5, width: 18, height: 18, "& svg": { fontSize: 12 } }} />}
                  label={`${budget.category} · ${Math.round(budget.percentUsed)}%`}
                />
              ))}
            </Stack>
          )}

          {summary.paceFraction !== null && (
            <Typography variant="caption" color="text.secondary">
              The dotted marker shows where you&apos;d be if you spent evenly through the month.
            </Typography>
          )}
        </Stack>
      </Stack>
    </SurfaceCard>
  );
}
