"use client";

import { Box, Chip, Stack, Typography, alpha, useTheme, type Theme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingFlatOutlinedIcon from "@mui/icons-material/TrendingFlatOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CARD_PADDING } from "@/lib/layout-constants";
import type { TrendDirection } from "@/lib/types";

function resolveThemeColor(theme: Theme, color: string) {
  const parts = color.split(".");
  if (parts.length === 2) {
    const [paletteKey, shade] = parts;
    const palette = theme.palette[paletteKey as keyof typeof theme.palette];
    if (palette && typeof palette === "object" && shade in palette) {
      return (palette as { main: string })[shade as "main"];
    }
  }
  return color;
}

type InsightCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: SvgIconComponent;
  iconColor?: string;
  tint?: "primary" | "success" | "error" | "warning" | "info";
  trend?: TrendDirection;
  trendLabel?: string;
  trendPositiveIsGood?: boolean;
};

function TrendIndicator({
  trend,
  label,
  positiveIsGood = true,
}: {
  trend: TrendDirection;
  label?: string;
  positiveIsGood?: boolean;
}) {
  if (!label && trend === "flat") return null;

  const isUp = trend === "up";
  const isGood = positiveIsGood ? isUp : !isUp;
  const color = trend === "flat" ? "text.secondary" : isGood ? "success.main" : "error.main";

  const Icon =
    trend === "up"
      ? TrendingUpOutlinedIcon
      : trend === "down"
        ? TrendingDownOutlinedIcon
        : TrendingFlatOutlinedIcon;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: "16px !important", color: `${color} !important` }} />}
      label={label ?? (trend === "flat" ? "Stable" : trend === "up" ? "Up" : "Down")}
      size="small"
      variant="outlined"
      sx={{
        borderColor: color,
        color,
        fontWeight: 600,
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}

export function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  tint = "primary",
  trend,
  trendLabel,
  trendPositiveIsGood = true,
}: InsightCardProps) {
  const theme = useTheme();
  const palette = theme.palette[tint];
  const resolvedIconColor = iconColor
    ? resolveThemeColor(theme, iconColor)
    : palette.main;

  return (
    <SurfaceCard
      hover
      accentColor={palette.main}
      sx={{
        p: CARD_PADDING,
        height: "100%",
        minHeight: { xs: 148, sm: 168 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1.75} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 2.5,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${alpha(resolvedIconColor, 0.22)} 0%, ${alpha(resolvedIconColor, 0.06)} 100%)`,
            color: resolvedIconColor,
            border: 1,
            borderColor: alpha(resolvedIconColor, 0.25),
          }}
        >
          <Icon sx={{ fontSize: 26 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.7rem", display: "block", mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} noWrap letterSpacing="-0.02em">
            {value}
          </Typography>
        </Box>
      </Stack>

      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: trend || trendLabel ? 1.5 : 0, lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      )}

      {trend && (
        <Box sx={{ mt: "auto" }}>
          <TrendIndicator
            trend={trend}
            label={trendLabel}
            positiveIsGood={trendPositiveIsGood}
          />
        </Box>
      )}
    </SurfaceCard>
  );
}
