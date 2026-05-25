"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { MonthlyIncomeExpenseChart } from "@/components/dashboard/monthly-income-expense-chart";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

type DashboardChartsProps = {
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
  /** When true, omit outer card chrome (used inside dashboard widget frame). */
  embedded?: boolean;
};

export function DashboardCharts({
  balanceChartData,
  monthlyChartData,
  embedded = false,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEmpty = balanceChartData.length === 0 && monthlyChartData.length === 0;

  if (isEmpty) {
    return (
      <ResponsiveColumns columns={{ xs: 1, md: 2 }} gap={2.5}>
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
    );
  }

  return (
    <ResponsiveColumns
      columns={embedded ? { xs: 1, md: 2 } : { xs: 1, lg: 2 }}
      gap={2.5}
    >
      <BalanceLineChart data={balanceChartData} chartReady={mounted} />
      <MonthlyIncomeExpenseChart data={monthlyChartData} chartReady={mounted} />
    </ResponsiveColumns>
  );
}
