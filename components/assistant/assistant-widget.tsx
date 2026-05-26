"use client";

import { useState } from "react";
import {
  Box,
  Fab,
  Fade,
  Portal,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { AssistantChatPanel } from "@/components/assistant/assistant-chat-panel";
import { useIsMobileNav } from "@/hooks/use-is-mobile-nav";
import { MOBILE_FLOATING_OFFSET } from "@/lib/config/layout-constants";

const FAB_SIZE = 56;
const FAB_OFFSET_DESKTOP = 24;
const PANEL_GAP = 16;
/** Keep panel below the top of the viewport (below app bar area). */
const VIEWPORT_TOP_GAP = 80;

export function AssistantWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobileNav = useIsMobileNav();
  const [open, setOpen] = useState(false);

  const fabBottomPx = isMobileNav ? MOBILE_FLOATING_OFFSET : FAB_OFFSET_DESKTOP;
  const fabBottom = isMobileNav
    ? `calc(${MOBILE_FLOATING_OFFSET}px + env(safe-area-inset-bottom, 0px))`
    : FAB_OFFSET_DESKTOP;
  const panelBottomPx = fabBottomPx + FAB_SIZE + PANEL_GAP;
  const panelWidth = isMobile ? "calc(100vw - 32px)" : 380;
  const maxPanelHeight = `calc(100dvh - ${panelBottomPx + VIEWPORT_TOP_GAP}px)`;
  const preferredHeight = isMobile ? "min(560px, 85dvh)" : "min(440px, 72dvh)";
  const zIndex = theme.zIndex.modal + 2;

  return (
    <Portal>
      <Fade in={open} mountOnEnter unmountOnExit>
        <Box
          role="dialog"
          aria-label="Financial insights assistant"
          aria-modal={open}
          sx={{
            position: "fixed",
            bottom: isMobileNav
              ? `calc(${panelBottomPx}px + env(safe-area-inset-bottom, 0px))`
              : panelBottomPx,
            right: FAB_OFFSET_DESKTOP,
            left: isMobile ? FAB_OFFSET_DESKTOP : "auto",
            width: panelWidth,
            height: `min(${preferredHeight}, ${maxPanelHeight})`,
            maxHeight: maxPanelHeight,
            minHeight: { xs: 280, sm: 320 },
            maxWidth: isMobile ? undefined : 400,
            zIndex,
            display: "flex",
            flexDirection: "column",
            isolation: "isolate",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          <AssistantChatPanel onClose={() => setOpen(false)} compact={isMobile} />
        </Box>
      </Fade>

      <Fab
        color="primary"
        aria-label={open ? "Close financial assistant" : "Open financial assistant"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          position: "fixed",
          bottom: fabBottom,
          right: FAB_OFFSET_DESKTOP,
          zIndex: zIndex + 1,
          width: FAB_SIZE,
          height: FAB_SIZE,
          boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.45)}`,
          background: open
            ? theme.palette.background.paper
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: open ? "text.primary" : "primary.contrastText",
          border: open ? 1 : 0,
          borderColor: "divider",
          "&:hover": {
            background: open
              ? theme.palette.action.hover
              : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          },
        }}
      >
        {open ? <CloseRoundedIcon /> : <AutoAwesomeOutlinedIcon />}
      </Fab>
    </Portal>
  );
}
