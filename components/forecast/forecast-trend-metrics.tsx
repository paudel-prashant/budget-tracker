"use client";

import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CalendarViewWeekOutlinedIcon from "@mui/icons-material/CalendarViewWeekOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { formatCurrency } from "@/lib/utils/format";
import type { ForecastEngineResult } from "@/lib/forecasting";

type ForecastTrendMetricsProps = {
  forecast: ForecastEngineResult;
  loading?: boolean;
};

export function ForecastTrendMetrics({ forecast, loading = false }: ForecastTrendMetricsProps) {
  const { averageDailySpending, averageWeeklySpending, averageMonthlySpending } =
    forecast.trends;

  const items = [
    {
      label: "Avg daily spending",
      value: formatCurrency(averageDailySpending),
      icon: PaymentsOutlinedIcon,
    },
    {
      label: "Avg weekly spending",
      value: formatCurrency(averageWeeklySpending),
      icon: CalendarViewWeekOutlinedIcon,
    },
    {
      label: "Avg monthly spending",
      value: formatCurrency(averageMonthlySpending),
      icon: CalendarMonthOutlinedIcon,
    },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.85 : 1, transition: "opacity 0.28s ease" }}>
      <ResponsiveColumns columns={{ xs: 1, sm: 3 }} gap={2}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" spacing={1.25} alignItems="center">
            <item.icon sx={{ fontSize: 20, color: "warning.main" }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {item.label}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {item.value}
              </Typography>
            </Box>
          </Stack>
        ))}
      </ResponsiveColumns>
    </Box>
  );
}
