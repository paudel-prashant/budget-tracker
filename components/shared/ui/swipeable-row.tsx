"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  MOTION_DURATION_MS,
  MOTION_EASE_OUT,
  SWIPE_ACTION_WIDTH,
  SWIPE_COMMIT_THRESHOLD,
} from "@/lib/theme/motion";

function hapticTap(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export type SwipeAction = {
  id: string;
  label: string;
  icon: ReactNode;
  color: "primary" | "error";
  onTrigger: () => void;
};

type SwipeableRowProps = {
  children: ReactNode;
  /** Shown when swiping right (leading edge). */
  leadingAction: SwipeAction;
  /** Shown when swiping left (trailing edge). */
  trailingAction: SwipeAction;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

export function SwipeableRow({
  children,
  leadingAction,
  trailingAction,
  disabled = false,
  sx,
}: SwipeableRowProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const active = useRef(false);

  const maxOffset = SWIPE_ACTION_WIDTH;

  const snapBack = useCallback(() => {
    setDragging(false);
    setOffset(0);
  }, []);

  const commit = useCallback(
    (action: SwipeAction) => {
      if (disabled) return;
      hapticTap();
      snapBack();
      action.onTrigger();
    },
    [disabled, snapBack]
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || reducedMotion) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    active.current = true;
    setDragging(true);
    startX.current = event.clientX;
    startOffset.current = offset;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!active.current || disabled || reducedMotion) return;
    const delta = event.clientX - startX.current;
    const next = Math.max(-maxOffset, Math.min(maxOffset, startOffset.current + delta));
    setOffset(next);
  };

  const onPointerUp = () => {
    if (!active.current) return;
    active.current = false;
    if (offset >= SWIPE_COMMIT_THRESHOLD) {
      commit(leadingAction);
      return;
    }
    if (offset <= -SWIPE_COMMIT_THRESHOLD) {
      commit(trailingAction);
      return;
    }
    snapBack();
  };

  const actionBg = (color: "primary" | "error") =>
    color === "primary" ? theme.palette.primary.main : theme.palette.error.main;

  return (
    <Box
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          borderRadius: 2.5,
          touchAction: "pan-y",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => commit(leadingAction)}
          disabled={disabled}
          aria-label={leadingAction.label}
          sx={{
            width: SWIPE_ACTION_WIDTH,
            flexShrink: 0,
            border: 0,
            cursor: disabled ? "default" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            bgcolor: actionBg(leadingAction.color),
            color: "primary.contrastText",
            opacity: offset > 8 ? 1 : 0.85,
            transition: `opacity ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}`,
          }}
        >
          {leadingAction.icon}
          <Typography variant="overline" sx={{ lineHeight: 1.2 }}>
            {leadingAction.label}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box
          component="button"
          type="button"
          onClick={() => commit(trailingAction)}
          disabled={disabled}
          aria-label={trailingAction.label}
          sx={{
            width: SWIPE_ACTION_WIDTH,
            flexShrink: 0,
            border: 0,
            cursor: disabled ? "default" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            bgcolor: actionBg(trailingAction.color),
            color: "error.contrastText",
            opacity: offset < -8 ? 1 : 0.85,
            transition: `opacity ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}`,
          }}
        >
          {trailingAction.icon}
          <Typography variant="overline" sx={{ lineHeight: 1.2 }}>
            {trailingAction.label}
          </Typography>
        </Box>
      </Box>

      <Box
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        sx={{
          position: "relative",
          zIndex: 1,
          transform: reducedMotion ? undefined : `translateX(${offset}px)`,
          transition:
            dragging || reducedMotion
              ? "none"
              : `transform ${MOTION_DURATION_MS}ms ${MOTION_EASE_OUT}`,
          bgcolor: "background.paper",
          boxShadow:
            Math.abs(offset) > 4
              ? `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`
              : "none",
          willChange: dragging ? "transform" : undefined,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
