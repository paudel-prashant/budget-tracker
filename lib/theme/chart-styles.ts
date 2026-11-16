import type { Theme } from "@mui/material/styles";
import { formatCurrencyAxis } from "@/lib/utils/format";

/**
 * Categorical palette — fixed slot order, validated (dataviz validate_palette.js) against
 * this app's paper surfaces: light #ffffff, dark #151b28. Adjacent-pair CVD ΔE ≥ 8.4,
 * normal-vision ΔE ≥ 19.3 in both modes. Three light slots sit below 3:1 on white, so every
 * use must carry visible labels (legend with names + values) — never colour alone.
 *
 * Assign slots by a stable entity order (e.g. a category's position in a preset list),
 * never by rank, so an entity keeps its colour when the data changes.
 */
export const CATEGORICAL_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"] as const;
export const CATEGORICAL_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"] as const;

/** Muted slot for an "Other" bucket — never a 7th hue. */
export const OTHER_LIGHT = "#94a3b8";
export const OTHER_DARK = "#64748b";

/** Single-hue sequential ramp (blue, light → dark) for magnitude, e.g. heatmaps. */
export const SEQUENTIAL_BLUE = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
] as const;

/** @deprecated kept for older imports; prefer getCategoricalPalette(theme). */
export const CHART_PALETTE = CATEGORICAL_LIGHT;

export function getCategoricalPalette(theme: Theme): readonly string[] {
  return theme.palette.mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

export function getOtherColor(theme: Theme): string {
  return theme.palette.mode === "dark" ? OTHER_DARK : OTHER_LIGHT;
}

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

/** Solid hairline, one shade off the surface (gridlines are never dashed). */
export function getChartGridStroke(theme: Theme) {
  return theme.palette.mode === "light" ? "rgba(148, 163, 184, 0.28)" : "rgba(148, 163, 184, 0.12)";
}

export function getAxisTick(theme: Theme, fontSize = 11) {
  return { fill: theme.palette.text.secondary, fontSize };
}

/** Compact currency axis labels in the user's display currency ($1.2K, €3M). */
export function currencyAxisTick(value: number | string): string {
  return formatCurrencyAxis(Number(value));
}
