"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { MOBILE_NAV_BREAKPOINT } from "@/lib/config/layout-constants";

/** True when the bottom navigation bar is shown instead of the sidebar. */
export function useIsMobileNav(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(MOBILE_NAV_BREAKPOINT), { noSsr: true });
}
