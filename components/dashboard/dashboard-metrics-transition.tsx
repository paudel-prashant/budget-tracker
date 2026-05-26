"use client";

import { Box, type SxProps, type Theme } from "@mui/material";

type DashboardMetricsTransitionProps = {
  loading?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/** Soft opacity transition while dashboard metrics refetch for a new date range. */
export function DashboardMetricsTransition({
  loading = false,
  children,
  sx,
}: DashboardMetricsTransitionProps) {
  return (
    <Box
      sx={[
        {
          width: "100%",
          minWidth: 0,
          opacity: loading ? 0.58 : 1,
          transform: loading ? "translateY(2px)" : "translateY(0)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
          pointerEvents: loading ? "none" : "auto",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
