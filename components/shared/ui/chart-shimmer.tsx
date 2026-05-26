"use client";

import { Box, Skeleton, type SxProps, type Theme } from "@mui/material";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { useChartPlotHeight } from "@/hooks/use-chart-plot-height";
import {
  CARD_PADDING,
  CHART_AREA_HEIGHT,
  CHART_CARD_MIN_HEIGHT,
} from "@/lib/config/layout-constants";

type PlotHeight = number | typeof CHART_AREA_HEIGHT;

type ChartPlotShimmerProps = {
  /** Visual hint matching the chart type that will load. */
  variant?: "line" | "bar";
  height?: PlotHeight;
  sx?: SxProps<Theme>;
};

const BAR_HEIGHTS = [0.42, 0.68, 0.52, 0.88, 0.58, 0.76, 0.48];

function LineChartShape() {
  return (
    <Box
      component="svg"
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      aria-hidden
      sx={{
        position: "absolute",
        left: "10%",
        right: "4%",
        top: "14%",
        bottom: "22%",
        width: "auto",
        height: "auto",
        color: "action.disabled",
        opacity: 0.55,
      }}
    >
      <path
        fill="currentColor"
        d="M0 120 C45 95 70 108 110 82 S175 48 220 62 300 38 360 52 L360 160 L0 160 Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M0 120 C45 95 70 108 110 82 S175 48 220 62 300 38 360 52"
      />
    </Box>
  );
}

export function ChartPlotShimmer({
  variant = "line",
  height: heightProp,
  sx,
}: ChartPlotShimmerProps) {
  const defaultHeight = useChartPlotHeight();
  const height = heightProp ?? defaultHeight;

  return (
    <Box
      aria-busy="true"
      aria-label="Loading chart"
      sx={[
        {
          width: "100%",
          height,
          borderRadius: 2,
          bgcolor: "action.hover",
          position: "relative",
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          position: "absolute",
          left: 12,
          top: 16,
          bottom: 28,
          width: 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            animation="wave"
            variant="rounded"
            width={index % 2 === 0 ? 28 : 22}
            height={10}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>

      {variant === "bar" ? (
        <Box
          sx={{
            position: "absolute",
            left: "12%",
            right: "4%",
            bottom: 22,
            top: "18%",
            display: "flex",
            alignItems: "flex-end",
            gap: { xs: 0.75, sm: 1.25 },
          }}
        >
          {BAR_HEIGHTS.map((fraction, index) => (
            <Skeleton
              key={index}
              animation="wave"
              variant="rounded"
              sx={{
                flex: 1,
                height: `${fraction * 100}%`,
                borderRadius: "6px 6px 2px 2px",
                minWidth: 0,
              }}
            />
          ))}
        </Box>
      ) : (
        <LineChartShape />
      )}

      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{
          position: "absolute",
          left: "10%",
          right: "4%",
          bottom: 14,
          height: 2,
          borderRadius: 1,
        }}
      />
    </Box>
  );
}

type ChartCardShimmerProps = {
  variant?: "line" | "bar";
  titleWidth?: string | number;
};

export function ChartCardShimmer({ variant = "line", titleWidth = "52%" }: ChartCardShimmerProps) {
  return (
    <SurfaceCard
      sx={{
        p: CARD_PADDING,
        width: "100%",
        minWidth: 0,
        minHeight: CHART_CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: 2.25 }}>
        <Skeleton
          animation="wave"
          variant="text"
          width={titleWidth}
          height={28}
          sx={{ maxWidth: "100%", mb: 0.75 }}
        />
        <Skeleton
          animation="wave"
          variant="text"
          width="72%"
          height={20}
          sx={{ maxWidth: "100%" }}
        />
      </Box>
      <ChartPlotShimmer variant={variant} />
    </SurfaceCard>
  );
}
