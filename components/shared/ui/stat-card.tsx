"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";

type StatCardProps = {
  title: string;
  value: string;
  icon: SvgIconComponent;
  tint: "primary" | "success" | "error" | "warning" | "info";
  accentGradient?: string;
};

export function StatCard({ title, value, icon: Icon, tint, accentGradient }: StatCardProps) {
  const theme = useTheme();
  const palette = theme.palette[tint];

  return (
    <SurfaceCard
      hover
      accentColor={accentGradient ?? palette.main}
      sx={{
        p: CARD_PADDING,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${alpha(palette.main, 0.2)} 0%, ${alpha(palette.main, 0.06)} 100%)`,
            color: palette.main,
            border: 1,
            borderColor: alpha(palette.main, 0.2),
          }}
        >
          <Icon sx={{ fontSize: 26 }} />
        </Box>
      </Box>
    </SurfaceCard>
  );
}
