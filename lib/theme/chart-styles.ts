import type { Theme } from "@mui/material/styles";

export const CHART_PALETTE = [
  "#4f46e5",
  "#059669",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#64748b",
] as const;

export function getChartTooltipStyle(theme: Theme) {
  return {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    boxShadow:
      theme.palette.mode === "light"
        ? "0 8px 24px rgba(15, 23, 42, 0.12)"
        : "0 8px 24px rgba(0, 0, 0, 0.4)",
    padding: "10px 14px",
    fontSize: 13,
  };
}

export function getChartGridStroke(theme: Theme) {
  return theme.palette.mode === "light" ? "rgba(148, 163, 184, 0.35)" : "rgba(148, 163, 184, 0.15)";
}
