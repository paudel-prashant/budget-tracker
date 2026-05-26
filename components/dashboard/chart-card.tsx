"use client";

import { Box, Typography } from "@mui/material";
import { ChartEmptyState } from "@/components/shared/ui/chart-empty-state";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import { CARD_PADDING, CHART_CARD_MIN_HEIGHT } from "@/lib/config/layout-constants";

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
  const plotHeight = useChartPlotHeight();

  return (
    <SurfaceCard
      sx={{
        p: CARD_PADDING,
        width: "100%",
        minWidth: 0,
        minHeight: isEmpty ? undefined : CHART_CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: isEmpty ? 1.5 : 2.25 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
        >
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
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            height: plotHeight,
            minHeight: plotHeight,
            flexShrink: 0,
            position: "relative",
          }}
        >
          {children}
        </Box>
      )}
    </SurfaceCard>
  );
}
