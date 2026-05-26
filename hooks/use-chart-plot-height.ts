"use client";

import { useMediaQuery, useTheme } from "@mui/material";

/** Pixel height for Recharts plot areas — ResponsiveContainer needs a numeric height, not 100%. */
export function useChartPlotHeight(): number {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  if (mdUp) return 300;
  if (smUp) return 260;
  return 220;
}
