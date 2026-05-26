export const DRAWER_WIDTH = 260;

export const APP_BAR_HEIGHT = 64;

/** Sticky mobile bottom navigation bar (excluding safe area). */
export const BOTTOM_NAV_HEIGHT = 64;

/** Center add button on the bottom bar. */
export const BOTTOM_NAV_ADD_BUTTON_SIZE = 48;

/** Extra scroll padding for the docked add button protrusion. */
export const BOTTOM_NAV_ADD_OVERFLOW = 28;

/** MUI breakpoint key: sidebar vs bottom nav (`theme.breakpoints.up(MOBILE_NAV_BREAKPOINT)` → sidebar). */
export const MOBILE_NAV_BREAKPOINT = "md" as const;

/** Minimum touch target per WCAG / mobile HIG (px). */
export const TOUCH_TARGET_MIN = 44;

/** Assistant FAB offset above bottom nav + center add protrusion on phones. */
export const MOBILE_FLOATING_OFFSET =
  BOTTOM_NAV_HEIGHT + BOTTOM_NAV_ADD_OVERFLOW + 12;

/** Fixed assistant FAB diameter (px). */
export const ASSISTANT_FAB_SIZE = 56;

/** Vertical rhythm between major page sections (MUI spacing units × 8px). */
export const PAGE_STACK_SPACING = 3;

/** Grid gap between cards and chart columns. */
export const SECTION_GAP = 3;

/** Main content area padding. */
export const PAGE_PADDING_Y = { xs: 2, sm: 3.5, md: 4 } as const;
export const PAGE_PADDING_X = { xs: 2, sm: 3.5, md: 4 } as const;

/** Card interior padding. */
export const CARD_PADDING = { xs: 2.5, sm: 3 } as const;

/** Dialog form field stack spacing. */
export const FORM_STACK_SPACING = 2.75;

export const CARD_SHADOW =
  "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)";

export const CARD_SHADOW_HOVER =
  "0 4px 8px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.1)";

export const CHART_AREA_HEIGHT = { xs: 220, sm: 260, md: 300 } as const;

export const CHART_CARD_MIN_HEIGHT = { xs: 300, sm: 340, md: 380 } as const;
