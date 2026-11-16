"use client";

import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { VizCard } from "@/components/shared/ui/viz/viz-card";
import type { ForecastInsight, ForecastInsightSeverity } from "@/lib/forecasting";

type ForecastInsightsPanelProps = {
  insights: ForecastInsight[];
};

const SEVERITY = {
  success: { icon: CelebrationOutlinedIcon, label: "Good news", tone: "success" },
  warning: { icon: WarningAmberOutlinedIcon, label: "Heads up", tone: "warning" },
  info: { icon: LightbulbOutlinedIcon, label: "Tip", tone: "info" },
} as const satisfies Record<ForecastInsightSeverity, { icon: unknown; label: string; tone: string }>;

export function ForecastInsightsPanel({ insights }: ForecastInsightsPanelProps) {
  const theme = useTheme();

  return (
    <VizCard title="What the forecast is telling you">
      {insights.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Insights will appear as more transaction history becomes available.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {insights.map((item) => {
            const meta = SEVERITY[item.severity];
            const color = theme.palette[meta.tone].main;
            const Icon = meta.icon;
            return (
              <Stack
                key={item.id}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.1 : 0.06),
                  border: 1,
                  borderColor: alpha(color, 0.2),
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color,
                    bgcolor: alpha(color, 0.16),
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  {/* Label + icon carry the meaning; colour only reinforces it. */}
                  <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: "block" }}>
                    {meta.label}
                  </Typography>
                  <Typography variant="body2">{item.message}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
    </VizCard>
  );
}
