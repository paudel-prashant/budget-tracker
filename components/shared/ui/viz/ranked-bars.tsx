"use client";

import { useEffect, useState } from "react";
import { Box, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { CategoryIcon } from "@/components/shared/ui/category-icon";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export type RankedBarItem = {
  key: string;
  label: string;
  value: number;
  /** Category name for the icon tile; defaults to the label. */
  category?: string;
  /** Extra hover detail, e.g. "12 transactions". */
  detail?: string;
};

type RankedBarsProps = {
  items: RankedBarItem[];
  format: (value: number) => string;
  /** One series → one colour for every bar (defaults to the primary colour). */
  color?: string;
  /** Show each item's share of the total next to the value. */
  showShare?: boolean;
  maxItems?: number;
  emptyMessage?: string;
};

/**
 * Category comparison as ranked rows: icon, name, a thin bar scaled to the largest value,
 * and the value. Easier to read than a pie and friendlier than a bare table.
 */
export function RankedBars({
  items,
  format,
  color,
  showShare = true,
  maxItems = 8,
  emptyMessage = "Nothing to show yet.",
}: RankedBarsProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reducedMotion);
  const barColor = color ?? theme.palette.primary.main;

  useEffect(() => {
    if (reducedMotion) {
      setGrown(true);
      return;
    }
    setGrown(false);
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [items, reducedMotion]);

  const rows = [...items].sort((a, b) => b.value - a.value).slice(0, maxItems);
  const max = rows[0]?.value ?? 0;
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (rows.length === 0 || max <= 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.75} component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {rows.map((row, index) => {
        const share = total > 0 ? (row.value / total) * 100 : 0;
        const width = Math.max(2, (row.value / max) * 100);
        return (
          <Tooltip
            key={row.key}
            placement="top-start"
            title={`${row.label}: ${format(row.value)} · ${share.toFixed(1)}% of total${row.detail ? ` · ${row.detail}` : ""}`}
          >
            <Stack component="li" direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "default" }}>
              <CategoryIcon category={row.category ?? row.label} size="medium" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {row.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                    {format(row.value)}
                    {showShare && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                        {share.toFixed(0)}%
                      </Typography>
                    )}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    mt: 0.75,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: grown ? `${width}%` : "0%",
                      borderRadius: 1,
                      bgcolor: barColor,
                      transition: reducedMotion ? undefined : `width 700ms cubic-bezier(.2,.8,.2,1) ${index * 60}ms`,
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
