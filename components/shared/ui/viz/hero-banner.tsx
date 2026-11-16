"use client";

import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { AnimatedNumber } from "@/components/shared/ui/viz/animated-number";
import { Sparkline } from "@/components/shared/ui/viz/sparkline";

type Tone = "primary" | "success" | "error" | "warning" | "info";

export type HeroDelta = {
  /** e.g. "+4.2% vs last month" */
  label: string;
  direction: "up" | "down" | "flat";
  /** Whether this movement is good news (drives the colour), independent of direction. */
  sentiment: "good" | "bad" | "neutral";
};

type HeroBannerProps = {
  eyebrow: string;
  value: number;
  format: (value: number) => string;
  icon: SvgIconComponent;
  tone?: Tone;
  delta?: HeroDelta | null;
  caption?: React.ReactNode;
  /** Recent values, oldest first, for the trend line. */
  trend?: number[];
  trendLabel?: string;
  /** Extra content under the headline (mini stats, a segmented bar…). */
  children?: React.ReactNode;
  /** Right-hand slot on wide screens (replaces the sparkline). */
  aside?: React.ReactNode;
};

function DeltaPill({ delta }: { delta: HeroDelta }) {
  const theme = useTheme();
  const color =
    delta.sentiment === "good"
      ? theme.palette.success.main
      : delta.sentiment === "bad"
        ? theme.palette.error.main
        : theme.palette.text.secondary;
  const Icon =
    delta.direction === "up"
      ? ArrowUpwardRoundedIcon
      : delta.direction === "down"
        ? ArrowDownwardRoundedIcon
        : RemoveRoundedIcon;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 99,
        bgcolor: alpha(color, 0.12),
        // Icon + words carry the meaning; colour is a reinforcement only.
        color,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      <Icon sx={{ fontSize: 15 }} />
      <span>{delta.label}</span>
    </Box>
  );
}

/** The page's headline number, with a bit of personality. */
export function HeroBanner({
  eyebrow,
  value,
  format,
  icon: Icon,
  tone = "primary",
  delta,
  caption,
  trend,
  trendLabel,
  children,
  aside,
}: HeroBannerProps) {
  const theme = useTheme();
  const main = theme.palette[tone].main;
  const isDark = theme.palette.mode === "dark";

  return (
    <SurfaceCard
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${alpha(main, isDark ? 0.22 : 0.12)} 0%, ${alpha(main, 0.03)} 55%, transparent 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          right: -60,
          top: -90,
          background: `radial-gradient(circle, ${alpha(main, isDark ? 0.25 : 0.16)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: "50%",
          right: 120,
          bottom: -80,
          background: `radial-gradient(circle, ${alpha(theme.palette.info.main, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2, md: 4 }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ position: "relative" }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: main,
                bgcolor: alpha(main, isDark ? 0.24 : 0.14),
                transform: "rotate(-6deg)",
              }}
            >
              <Icon sx={{ fontSize: 20, transform: "rotate(6deg)" }} />
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, lineHeight: 1.4 }}>
              {eyebrow}
            </Typography>
          </Stack>

          <Typography
            component="p"
            sx={{
              mt: 1.5,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              fontSize: { xs: "2.25rem", sm: "2.75rem", md: "3.1rem" },
              position: "relative",
              color: value < 0 ? "error.main" : "text.primary",
            }}
          >
            <AnimatedNumber value={value} format={format} />
          </Typography>

          {(delta || caption) && (
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              {delta && <DeltaPill delta={delta} />}
              {caption && (
                <Typography variant="body2" color="text.secondary" component="div">
                  {caption}
                </Typography>
              )}
            </Stack>
          )}

          {children && <Box sx={{ mt: 2.5 }}>{children}</Box>}
        </Box>

        {aside ??
          (trend && trend.length > 1 ? (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", md: "center" } }}>
              <Sparkline values={trend} color={main} width={200} height={72} ariaLabel={trendLabel} />
              {trendLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {trendLabel}
                </Typography>
              )}
            </Box>
          ) : null)}
      </Stack>
    </SurfaceCard>
  );
}
