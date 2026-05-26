import type { SxProps, Theme } from "@mui/material";
import { TOUCH_TARGET_MIN } from "@/lib/config/layout-constants";

/** Ensures icon buttons meet minimum touch size on mobile. */
export const touchIconButtonSx: SxProps<Theme> = {
  minWidth: TOUCH_TARGET_MIN,
  minHeight: TOUCH_TARGET_MIN,
};
