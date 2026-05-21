"use client";

import { useEffect, useState } from "react";
import { Box, Grid, Skeleton } from "@mui/material";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { MonthlyIncomeExpenseChart } from "@/components/dashboard/monthly-income-expense-chart";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

type DashboardChartsProps = {
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
};

function ChartSkeleton() {
  return (
    <Box
      sx={{
        p: 3,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        height: "100%",
      }}
    >
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="rounded" sx={{ mt: 2, height: { xs: 260, sm: 300 } }} />
    </Box>
  );
}

export function DashboardCharts({
  balanceChartData,
  monthlyChartData,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} lg={6}>
          <ChartSkeleton />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ChartSkeleton />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mt: 3 }}>
      <Grid item xs={12} lg={6}>
        <BalanceLineChart data={balanceChartData} />
      </Grid>
      <Grid item xs={12} lg={6}>
        <MonthlyIncomeExpenseChart data={monthlyChartData} />
      </Grid>
    </Grid>
  );
}
