"use client";

import { Box, Paper, Typography } from "@mui/material";
import { ChartEmptyState } from "@/components/ui/chart-empty-state";
import { CARD_SHADOW, CHART_AREA_HEIGHT, CHART_CARD_MIN_HEIGHT } from "@/lib/layout-constants";

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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: "divider",
        height: "100%",
        minHeight: isEmpty ? undefined : CHART_CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        boxShadow: CARD_SHADOW,
      }}
    >
      <Box sx={{ mb: isEmpty ? 1.5 : 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {isEmpty ? (
        <ChartEmptyState message={emptyMessage} compact />
      ) : (
        <Box sx={{ width: "100%", height: CHART_AREA_HEIGHT, flexShrink: 0 }}>{children}</Box>
      )}
    </Paper>
  );
}
