"use client";

import { useState } from "react";
import { Box, Paper, useTheme } from "@mui/material";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import { usePathname } from "next/navigation";
import { BottomNavAddButton } from "@/components/shared/layout/bottom-nav-add-button";
import { BottomNavTab } from "@/components/shared/layout/bottom-nav-tab";
import { MobileNavMoreSheet } from "@/components/shared/layout/mobile-nav-more-sheet";
import { bottomNavItems } from "@/lib/config/navigation";
import {
  BOTTOM_NAV_ADD_BUTTON_SIZE,
  BOTTOM_NAV_HEIGHT,
} from "@/lib/config/layout-constants";

const LEFT_TABS = bottomNavItems.slice(0, 2);
const RIGHT_TABS = bottomNavItems.slice(2);

function isTabActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Routes reachable only via the More sheet (not in bottom bar). */
function moreNavActive(pathname: string): boolean {
  const moreOnlyPrefixes = ["/budget", "/recurring", "/reports", "/net-worth", "/settings"];
  return moreOnlyPrefixes.some((p) => pathname.startsWith(p));
}

export function BottomNav() {
  const theme = useTheme();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreHighlighted = moreOpen || moreNavActive(pathname);

  return (
    <>
      <Paper
        component="nav"
        aria-label="Main navigation"
        elevation={0}
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
          overflow: "visible",
          boxShadow: "0 -4px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: BOTTOM_NAV_HEIGHT,
            display: "flex",
            alignItems: "flex-end",
            px: 0.5,
            pt: `${BOTTOM_NAV_ADD_BUTTON_SIZE / 2}px`,
            isolation: "isolate",
          }}
        >
          <Box sx={{ flex: 1, display: "flex", minWidth: 0, alignItems: "flex-end" }}>
            {LEFT_TABS.map((item) => (
              <BottomNavTab
                key={item.href}
                label={item.label}
                icon={item.icon}
                href={item.href}
                active={isTabActive(pathname, item.href) && !moreOpen}
                onClick={() => setMoreOpen(false)}
              />
            ))}
          </Box>

          <Box
            sx={{
              width: BOTTOM_NAV_ADD_BUTTON_SIZE + 20,
              flexShrink: 0,
            }}
            aria-hidden
          />

          <Box sx={{ flex: 1, display: "flex", minWidth: 0, alignItems: "flex-end" }}>
            {RIGHT_TABS.map((item) => (
              <BottomNavTab
                key={item.href}
                label={item.label}
                icon={item.icon}
                href={item.href}
                active={isTabActive(pathname, item.href) && !moreOpen}
                onClick={() => setMoreOpen(false)}
              />
            ))}
            <BottomNavTab
              label="More"
              icon={MoreHorizOutlinedIcon}
              active={moreHighlighted}
              onClick={() => setMoreOpen(true)}
              ariaLabel="More navigation"
              ariaExpanded={moreOpen}
            />
          </Box>

          <BottomNavAddButton />
        </Box>
      </Paper>

      <MobileNavMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
