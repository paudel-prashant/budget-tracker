"use client";

import { Box, Typography } from "@mui/material";
import { ChartEmptyState } from "@/components/ui/chart-empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CARD_PADDING, CHART_AREA_HEIGHT, CHART_CARD_MIN_HEIGHT } from "@/lib/layout-constants";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  isEmpty = false,
  emptyMessage,
  children,
}: ChartCardProps) {
  return (
    <SurfaceCard
      sx={{
        p: CARD_PADDING,
        height: "100%",
        minHeight: isEmpty ? undefined : CHART_CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: isEmpty ? 1.5 : 2.25 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {isEmpty ? (
        <ChartEmptyState message={emptyMessage} compact />
      ) : (
        <Box sx={{ width: "100%", height: CHART_AREA_HEIGHT, flexShrink: 0 }}>{children}</Box>
      )}
    </SurfaceCard>
  );
}
