"use client";

import { useCallback, useState } from "react";
import { Fab, alpha, useTheme } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQuickTransaction } from "@/components/transactions/quick-transaction-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { BOTTOM_NAV_ADD_BUTTON_SIZE } from "@/lib/config/layout-constants";

/** Center-docked add control — sits on the bottom bar, not over scrollable content. */
export function BottomNavAddButton() {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const { openQuickAdd } = useQuickTransaction();
  const [pressing, setPressing] = useState(false);

  const handleClick = useCallback(() => {
    if (!reducedMotion) {
      setPressing(true);
      window.setTimeout(() => setPressing(false), 350);
    }
    openQuickAdd();
  }, [openQuickAdd, reducedMotion]);

  return (
    <Fab
      color="primary"
      size="medium"
      aria-label="Add transaction"
      onClick={handleClick}
      className={pressing ? "fab-press-animation" : undefined}
      sx={{
        position: "absolute",
        left: "50%",
        top: -BOTTOM_NAV_ADD_BUTTON_SIZE / 2 + 4,
        transform: "translateX(-50%)",
        width: BOTTOM_NAV_ADD_BUTTON_SIZE,
        height: BOTTOM_NAV_ADD_BUTTON_SIZE,
        minHeight: BOTTOM_NAV_ADD_BUTTON_SIZE,
        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
        border: `3px solid ${theme.palette.background.paper}`,
        zIndex: 10,
        "&:active": {
          transform: reducedMotion ? "translateX(-50%)" : "translateX(-50%) scale(0.96)",
        },
      }}
    >
      <AddOutlinedIcon />
    </Fab>
  );
}
