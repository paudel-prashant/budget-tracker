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

/** Large KPI / stat values on cards. */
export const statValueSx: SxProps<Theme> = {
  typography: { xs: "h5", sm: "h4" },
};

/** Chart card section title. */
export const chartTitleSx: SxProps<Theme> = {
  typography: { xs: "subtitle1", sm: "h6" },
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
