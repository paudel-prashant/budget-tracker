"use client";

import { Paper, type PaperProps } from "@mui/material";
import { CARD_SHADOW, CARD_SHADOW_HOVER } from "@/lib/layout-constants";

type SurfaceCardProps = PaperProps & {
  accentColor?: string;
  hover?: boolean;
};

export function SurfaceCard({
  accentColor,
  hover = false,
  children,
  sx,
  ...props
}: SurfaceCardProps) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          boxShadow: CARD_SHADOW,
          transition: hover
            ? "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease"
            : undefined,
          ...(hover && {
            "&:hover": {
              boxShadow: CARD_SHADOW_HOVER,
            },
          }),
          ...(accentColor && {
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: accentColor,
            },
          }),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}
