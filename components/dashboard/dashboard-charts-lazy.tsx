"use client";

import dynamic from "next/dynamic";
import { Box, Skeleton } from "@mui/material";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { CHART_CARD_MIN_HEIGHT } from "@/lib/config/layout-constants";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

function ChartsSkeleton() {
  return (
    <ResponsiveColumns columns={{ xs: 1, md: 2 }} gap={2.5}>
      {[0, 1].map((key) => (
        <Box
          key={key}
          sx={{
            width: "100%",
            minHeight: CHART_CARD_MIN_HEIGHT,
            borderRadius: 2.5,
            overflow: "hidden",
          }}
        >
          <Skeleton variant="rounded" height="100%" sx={{ minHeight: CHART_CARD_MIN_HEIGHT }} />
        </Box>
      ))}
    </ResponsiveColumns>
  );
}

const DashboardCharts = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.DashboardCharts),
  { loading: () => <ChartsSkeleton />, ssr: false }
);

type DashboardChartsLazyProps = {
  balanceChartData: BalanceChartPoint[];
  monthlyChartData: MonthlyChartPoint[];
  embedded?: boolean;
};

export function DashboardChartsLazy(props: DashboardChartsLazyProps) {
  return <DashboardCharts {...props} />;
}
