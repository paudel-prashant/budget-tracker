"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { MonthlyIncomeExpenseChart } from "@/components/dashboard/monthly-income-expense-chart";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CARD_PADDING } from "@/lib/layout-constants";
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
      <SurfaceCard sx={{ p: CARD_PADDING, width: "100%" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          Trends & charts
        </Typography>
        <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
          Balance over time and monthly income vs expenses appear once you have transaction history.
        </Typography>
        <ResponsiveColumns columns={{ xs: 1, sm: 2 }}>
          <Box
            sx={{
              py: 3,
              px: 2.5,
              borderRadius: 2.5,
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              bgcolor: "action.hover",
              width: "100%",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Balance over time
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Waiting for transactions
            </Typography>
          </Box>
          <Box
            sx={{
              py: 3,
              px: 2.5,
              borderRadius: 2.5,
              border: 1,
              borderColor: "divider",
              borderStyle: "dashed",
              bgcolor: "action.hover",
              width: "100%",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Income vs expenses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Waiting for transactions
            </Typography>
          </Box>
        </ResponsiveColumns>
      </SurfaceCard>
    );
  }

  return (
    <ResponsiveColumns columns={{ xs: 1, lg: 2 }}>
      <BalanceLineChart data={balanceChartData} chartReady={mounted} />
      <MonthlyIncomeExpenseChart data={monthlyChartData} chartReady={mounted} />
    </ResponsiveColumns>
  );
}
