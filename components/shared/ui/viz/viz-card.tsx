"use client";

import { Box, Stack, Typography } from "@mui/material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { chartTitleSx } from "@/lib/theme/typography";

type VizCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

/** Card chrome for non-Recharts visuals (ranked bars, heatmaps, segmented bars). */
export function VizCard({ title, subtitle, action, children }: VizCardProps) {
  return (
    <SurfaceCard sx={{ p: CARD_PADDING, height: "100%", minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={chartTitleSx}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </SurfaceCard>
  );
}
