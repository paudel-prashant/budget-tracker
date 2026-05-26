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
import { useMounted } from "@/hooks/use-mounted";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { AssistantChatPanel } from "@/components/assistant/assistant-chat-panel";
import {
  ASSISTANT_FAB_SIZE,
  MOBILE_FLOATING_OFFSET,
  MOBILE_NAV_BREAKPOINT,
} from "@/lib/config/layout-constants";

const FAB_SIZE = ASSISTANT_FAB_SIZE;
const FAB_OFFSET_DESKTOP = 24;
const PANEL_GAP = 16;
const VIEWPORT_TOP_GAP = 80;

const PANEL_BOTTOM_MOBILE = `calc(${MOBILE_FLOATING_OFFSET + FAB_SIZE + PANEL_GAP}px + env(safe-area-inset-bottom, 0px))`;
const FAB_BOTTOM_MOBILE = `calc(${MOBILE_FLOATING_OFFSET}px + env(safe-area-inset-bottom, 0px))`;

export function AssistantWidget() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const matchesSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isCompactPanel = mounted && matchesSmall;

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
            bottom: {
              xs: PANEL_BOTTOM_MOBILE,
              [MOBILE_NAV_BREAKPOINT]: FAB_OFFSET_DESKTOP + FAB_SIZE + PANEL_GAP,
            },
            right: FAB_OFFSET_DESKTOP,
            left: { xs: FAB_OFFSET_DESKTOP, sm: FAB_OFFSET_DESKTOP, md: "auto" },
            width: { xs: "calc(100vw - 32px)", md: 380 },
            height: {
              xs: `min(min(560px, 85dvh), calc(100dvh - ${MOBILE_FLOATING_OFFSET + FAB_SIZE + PANEL_GAP + VIEWPORT_TOP_GAP}px))`,
              md: "min(440px, 72dvh)",
            },
            maxHeight: {
              xs: `calc(100dvh - ${MOBILE_FLOATING_OFFSET + FAB_SIZE + PANEL_GAP + VIEWPORT_TOP_GAP}px - env(safe-area-inset-bottom, 0px))`,
              md: `calc(100dvh - ${FAB_OFFSET_DESKTOP + FAB_SIZE + PANEL_GAP + VIEWPORT_TOP_GAP}px)`,
            },
            minHeight: { xs: 280, md: 320 },
            maxWidth: { xs: undefined, md: 400 },
            zIndex,
            display: "flex",
            flexDirection: "column",
            isolation: "isolate",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          <AssistantChatPanel onClose={() => setOpen(false)} compact={isCompactPanel} />
        </Box>
      </Fade>

      <Fab
        color="primary"
        aria-label={open ? "Close financial assistant" : "Open financial assistant"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          position: "fixed",
          bottom: {
            xs: FAB_BOTTOM_MOBILE,
            [MOBILE_NAV_BREAKPOINT]: FAB_OFFSET_DESKTOP,
          },
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
