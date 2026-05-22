"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { SECTION_GAP } from "@/lib/config/layout-constants";

export type ColumnBreakpoints = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
};

type TemplateColumns = {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
};

type ResponsiveColumnsProps = {
  children: ReactNode;
  /** Equal column counts per breakpoint (ignored when templateColumns is set). */
  columns?: ColumnBreakpoints;
  /** Custom grid-template-columns, e.g. `{ lg: "2fr 1fr" }` for 8/4 split. */
  templateColumns?: TemplateColumns;
  gap?: number;
};

function resolveColumns(
  columns: ColumnBreakpoints,
  breakpoint: keyof ColumnBreakpoints,
  fallback: number
): number {
  if (breakpoint === "lg") {
    return columns.lg ?? columns.md ?? columns.sm ?? columns.xs ?? fallback;
  }
  if (breakpoint === "md") {
    return columns.md ?? columns.sm ?? columns.xs ?? fallback;
  }
  if (breakpoint === "sm") {
    return columns.sm ?? columns.xs ?? fallback;
  }
  return columns.xs ?? fallback;
}

/**
 * Equal-width responsive columns using CSS Grid (replaces legacy MUI Grid item/size).
 */
export function ResponsiveColumns({
  children,
  columns = { xs: 1, sm: 2, md: 3 },
  templateColumns,
  gap = SECTION_GAP,
}: ResponsiveColumnsProps) {
  const equalColumns = {
    xs: `repeat(${resolveColumns(columns, "xs", 1)}, minmax(0, 1fr))`,
    sm: `repeat(${resolveColumns(columns, "sm", 2)}, minmax(0, 1fr))`,
    md: `repeat(${resolveColumns(columns, "md", 3)}, minmax(0, 1fr))`,
    ...(columns.lg
      ? { lg: `repeat(${resolveColumns(columns, "lg", 3)}, minmax(0, 1fr))` }
      : {}),
  };

  return (
    <Box
      sx={{
        display: "grid",
        width: "100%",
        gap,
        gridTemplateColumns: templateColumns
          ? {
              xs: templateColumns.xs ?? "1fr",
              ...(templateColumns.sm ? { sm: templateColumns.sm } : {}),
              ...(templateColumns.md ? { md: templateColumns.md } : {}),
              ...(templateColumns.lg ? { lg: templateColumns.lg } : {}),
            }
          : equalColumns,
      }}
    >
      {children}
    </Box>
  );
}
