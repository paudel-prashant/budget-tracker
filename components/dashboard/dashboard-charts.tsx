"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { MonthlyIncomeExpenseChart } from "@/components/dashboard/monthly-income-expense-chart";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";
import { CARD_SHADOW } from "@/lib/layout-constants";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

type DashboardChartsProps = {
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
};

export function DashboardCharts({
  balanceChartData,
  monthlyChartData,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmpty = balanceChartData.length === 0 && monthlyChartData.length === 0;

  if (isEmpty) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          border: 1,
          borderColor: "divider",
          boxShadow: CARD_SHADOW,
          width: "100%",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
          Trends & charts
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Balance over time and monthly income vs expenses appear once you have transaction history.
        </Typography>
        <ResponsiveColumns columns={{ xs: 1, sm: 2 }} gap={2}>
          <Box
            sx={{
              py: 2,
              px: 2,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              bgcolor: "background.default",
              width: "100%",
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              Balance over time
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Waiting for transactions
            </Typography>
          </Box>
          <Box
            sx={{
              py: 2,
              px: 2,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              bgcolor: "background.default",
              width: "100%",
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              Income vs expenses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Waiting for transactions
            </Typography>
          </Box>
        </ResponsiveColumns>
      </Paper>
    );
  }

  return (
    <ResponsiveColumns columns={{ xs: 1, lg: 2 }} gap={2.5}>
      <BalanceLineChart data={balanceChartData} chartReady={mounted} />
      <MonthlyIncomeExpenseChart data={monthlyChartData} chartReady={mounted} />
    </ResponsiveColumns>
  );
}
