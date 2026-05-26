"use client";

import {
  Box,
  Dialog,
  DialogTitle,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
  type DialogProps,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MOTION_DURATION_MS, MOTION_EASE_OUT } from "@/lib/theme/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type DialogShellProps = DialogProps & {
  title: string;
  subtitle?: string;
};

export function DialogShell({ title, subtitle, children, sx, ...props }: DialogShellProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Dialog
      {...props}
      fullScreen={fullScreen}
      slots={fullScreen && !reducedMotion ? { transition: Slide } : undefined}
      slotProps={
        fullScreen && !reducedMotion
          ? {
              transition: {
                direction: "up",
                timeout: MOTION_DURATION_MS,
                easing: { enter: MOTION_EASE_OUT, exit: MOTION_EASE_OUT },
              },
            }
          : undefined
      }
      scroll="paper"
      sx={[
        {
          "& .MuiDialog-paper": {
            m: fullScreen ? 0 : { xs: 2, sm: 3 },
            width: fullScreen ? "100%" : undefined,
            maxHeight: fullScreen ? "100dvh" : undefined,
            borderRadius: fullScreen ? 0 : undefined,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            boxShadow:
              theme.palette.mode === "light"
                ? "0 24px 48px rgba(15, 23, 42, 0.14)"
                : "0 24px 48px rgba(0, 0, 0, 0.5)",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          pt: 3,
          pb: subtitle ? 2 : 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 55%)`,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <DialogTitle sx={{ p: 0 }}>{title}</DialogTitle>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Dialog>
  );
}
