"use client";

import { useMemo, useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useTheme,
} from "@mui/material";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNavMoreSheet } from "@/components/shared/layout/mobile-nav-more-sheet";
import { bottomNavItems } from "@/lib/config/navigation";
import { BOTTOM_NAV_HEIGHT } from "@/lib/config/layout-constants";
import { MOTION_DURATION_MS, MOTION_EASE_OUT } from "@/lib/theme/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const TAB_COUNT = bottomNavItems.length + 1;

function resolveNavValue(pathname: string): string {
  const match = bottomNavItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return match?.href ?? "";
}

function resolveActiveTabIndex(pathname: string, moreOpen: boolean): number {
  if (moreOpen) return TAB_COUNT - 1;
  const matchIndex = bottomNavItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return matchIndex >= 0 ? matchIndex : -1;
}

export function BottomNav() {
  const theme = useTheme();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeValue = resolveNavValue(pathname);
  const activeTabIndex = resolveActiveTabIndex(pathname, moreOpen);

  const indicatorStyle = useMemo(() => {
    if (activeTabIndex < 0) {
      return { opacity: 0 };
    }
    const widthPercent = 100 / TAB_COUNT;
    return {
      width: `${widthPercent}%`,
      left: `${activeTabIndex * widthPercent}%`,
      opacity: 1,
    };
  }, [activeTabIndex]);

  return (
    <>
      <Paper
        component="nav"
        aria-label="Main navigation"
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          pb: "env(safe-area-inset-bottom, 0px)",
          display: { xs: "block", md: "none" },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              height: 3,
              borderRadius: "0 0 3px 3px",
              bgcolor: "primary.main",
              transition: reducedMotion
                ? "none"
                : `left ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}, width ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}, opacity 0.2s ease`,
              ...indicatorStyle,
            }}
          />
          <BottomNavigation
            value={moreOpen ? "more" : activeValue}
            showLabels
            sx={{
              height: BOTTOM_NAV_HEIGHT,
              bgcolor: "transparent",
              "& .MuiBottomNavigationAction-root": {
                minWidth: 56,
                maxWidth: 120,
                py: 0.75,
                color: "text.secondary",
                transition: reducedMotion
                  ? "none"
                  : `color ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}, transform 0.2s ${MOTION_EASE_OUT}`,
                "&.Mui-selected": {
                  color: "primary.main",
                  "& .MuiSvgIcon-root": {
                    transform: reducedMotion ? "none" : "scale(1.08)",
                  },
                },
              },
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.6875rem",
                fontWeight: 500,
                "&.Mui-selected": {
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                },
              },
            }}
          >
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeValue && !moreOpen;
              return (
                <BottomNavigationAction
                  key={item.href}
                  component={Link}
                  href={item.href}
                  prefetch={false}
                  value={item.href}
                  label={item.label}
                  icon={<Icon sx={{ fontSize: 24, transition: "transform 0.2s ease" }} />}
                  onClick={() => setMoreOpen(false)}
                  className={isActive ? "bottom-nav-item-active" : undefined}
                />
              );
            })}
            <BottomNavigationAction
              value="more"
              label="More"
              icon={<MoreHorizOutlinedIcon sx={{ fontSize: 24 }} />}
              onClick={() => setMoreOpen(true)}
              className={moreOpen ? "bottom-nav-item-active" : undefined}
            />
          </BottomNavigation>
        </Box>
      </Paper>

      <MobileNavMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
