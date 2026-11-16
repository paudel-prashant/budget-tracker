"use client";

import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { CategoryIcon } from "@/components/shared/ui/category-icon";

export type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Category name for an icon tile in the legend (omit for no icon). */
  category?: string;
};

type SegmentedBarProps = {
  segments: Segment[];
  format: (value: number) => string;
  height?: number;
  /** Legend layout: a wrapped row of chips, or a full list with values. */
  legend?: "list" | "inline" | "none";
  ariaLabel?: string;
};

/**
 * Part-to-whole at a glance (≤ 6 segments + "Other"). 2px surface gaps between fills,
 * rounded outer ends, and a labelled legend so identity never rests on colour alone.
 */
export function SegmentedBar({ segments, format, height = 14, legend = "list", ariaLabel }: SegmentedBarProps) {
  const theme = useTheme();
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return null;

  return (
    <Box>
      <Box
        role="img"
        aria-label={
          ariaLabel ??
          visible.map((s) => `${s.label} ${((s.value / total) * 100).toFixed(0)}%`).join(", ")
        }
        sx={{ display: "flex", gap: "2px", height, width: "100%" }}
      >
        {visible.map((segment, index) => {
          const share = (segment.value / total) * 100;
          return (
            <Tooltip
              key={segment.key}
              title={`${segment.label}: ${format(segment.value)} (${share.toFixed(1)}%)`}
            >
              <Box
                sx={{
                  flexGrow: segment.value,
                  flexBasis: 0,
                  minWidth: 4,
                  bgcolor: segment.color,
                  borderTopLeftRadius: index === 0 ? 4 : 0,
                  borderBottomLeftRadius: index === 0 ? 4 : 0,
                  borderTopRightRadius: index === visible.length - 1 ? 4 : 0,
                  borderBottomRightRadius: index === visible.length - 1 ? 4 : 0,
                  transition: "filter 120ms ease",
                  "&:hover": { filter: "brightness(1.1)" },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {legend === "inline" && (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
          {visible.map((segment) => (
            <Stack key={segment.key} direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: 0.75, bgcolor: segment.color, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">
                {segment.label}{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                  {((segment.value / total) * 100).toFixed(0)}%
                </Box>
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {legend === "list" && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {visible.map((segment) => (
            <Stack key={segment.key} direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 4, alignSelf: "stretch", borderRadius: 1, bgcolor: segment.color, flexShrink: 0 }} />
              {segment.category !== undefined && <CategoryIcon category={segment.category} size="small" />}
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {segment.label}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {format(segment.value)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ width: 40, textAlign: "right", color: theme.palette.text.secondary }}
              >
                {((segment.value / total) * 100).toFixed(0)}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

/** Keep the largest `max` items and fold the rest into a single "Other" item. */
export function foldToTop<T extends { value: number }>(
  items: T[],
  max: number,
  makeOther: (value: number, count: number) => T
): T[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const kept = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1);
  return [...kept, makeOther(rest.reduce((sum, item) => sum + item.value, 0), rest.length)];
}
