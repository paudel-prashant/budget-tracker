"use client";

import { Box, ButtonBase, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { statValueSx } from "@/lib/theme/typography";

type StatCardProps = {
  title: string;
  value: string;
  icon: SvgIconComponent;
  tint: "primary" | "success" | "error" | "warning" | "info";
  accentGradient?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function StatCard({
  title,
  value,
  icon: Icon,
  tint,
  accentGradient,
  onClick,
  disabled = false,
  ariaLabel,
}: StatCardProps) {
  const theme = useTheme();
  const palette = theme.palette[tint];
  const interactive = Boolean(onClick) && !disabled;

  const card = (
    <SurfaceCard
      hover={interactive}
      accentColor={accentGradient ?? palette.main}
      sx={{
        p: CARD_PADDING,
        height: "100%",
        width: "100%",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={statValueSx}>
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

  if (!interactive) {
    return card;
  }

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? `${title}: ${value}. View details`}
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        textAlign: "left",
        borderRadius: 3,
        "&:focus-visible": {
          outline: 2,
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      {card}
    </ButtonBase>
  );
}
