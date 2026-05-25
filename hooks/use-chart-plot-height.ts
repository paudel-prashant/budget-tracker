"use client";

import { useMediaQuery, useTheme } from "@mui/material";

/** Pixel height for Recharts plot areas — ResponsiveContainer needs a numeric height, not 100%. */
export function useChartPlotHeight(): number {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  return smUp ? 300 : 260;
}
