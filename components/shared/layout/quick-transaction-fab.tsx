"use client";

import { useCallback, useState } from "react";
import { Fab, Tooltip, alpha, useTheme } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQuickTransaction } from "@/components/transactions/quick-transaction-provider";
import { useIsMobileNav } from "@/hooks/use-is-mobile-nav";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { MOBILE_FLOATING_OFFSET } from "@/lib/config/layout-constants";

const FAB_SIZE = 56;

export function QuickTransactionFab() {
  const theme = useTheme();
  const isMobileNav = useIsMobileNav();
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

  if (!isMobileNav) return null;

  return (
    <Tooltip title="Add transaction" placement="right">
      <Fab
        color="secondary"
        aria-label="Add transaction"
        onClick={handleClick}
        className={pressing ? "fab-press-animation" : undefined}
        sx={{
          position: "fixed",
          bottom: `calc(${MOBILE_FLOATING_OFFSET}px + env(safe-area-inset-bottom, 0px))`,
          left: 20,
          zIndex: theme.zIndex.speedDial,
          width: FAB_SIZE,
          height: FAB_SIZE,
          boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.45)}`,
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          "&:active": {
            transform: reducedMotion ? undefined : "scale(0.96)",
          },
        }}
      >
        <AddOutlinedIcon />
      </Fab>
    </Tooltip>
  );
}
