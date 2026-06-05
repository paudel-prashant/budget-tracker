import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Shared typography sx — use theme variants + these helpers instead of one-off font sizes.
 */

/** Page / screen title (responsive). */
export const pageTitleSx: SxProps<Theme> = {
  typography: { xs: "h5", md: "h4" },
};

/** Page subtitle under the main title. */
export const pageDescriptionSx: SxProps<Theme> = {
  typography: { xs: "body2", sm: "body1" },
};

/** Dashboard widget chrome title (sentence case, no wide tracking). */
export const widgetSectionTitleSx: SxProps<Theme> = {
  typography: "subtitle2",
  fontWeight: 600,
  letterSpacing: "normal",
  textTransform: "none",
};

/** Small label above KPI values on dashboard cards. */
export const widgetLabelSx: SxProps<Theme> = {
  typography: "caption",
  color: "text.secondary",
  letterSpacing: "normal",
  textTransform: "none",
};

/** In-widget content heading (insights headline, goals intro, etc.). */
export const widgetContentTitleSx: SxProps<Theme> = {
  typography: "subtitle1",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

/** Large KPI / stat values on cards. */
export const statValueSx: SxProps<Theme> = {
  typography: { xs: "subtitle1", sm: "h6" },
  fontWeight: 700,
};

/** Chart card section title. */
export const chartTitleSx: SxProps<Theme> = {
  typography: { xs: "subtitle2", sm: "subtitle1" },
  fontWeight: 600,
};

/** App name in nav chrome (sidebar, top bar). */
export const brandTitleSx: SxProps<Theme> = {
  fontWeight: 700,
};

/** Card, table row, or list item title. */
export const cardTitleSx: SxProps<Theme> = {
  fontWeight: 700,
};

/** Emphasized body text (totals, active nav, etc.). */
export const emphasisBodySx: SxProps<Theme> = {
  fontWeight: 600,
};
