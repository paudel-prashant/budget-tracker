"use client";

import dynamic from "next/dynamic";
import { ChartCardShimmer } from "@/components/shared/ui/chart-shimmer";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import type { BalanceChartPoint, MonthlyChartPoint } from "@/lib/types";

function ChartsSkeleton() {
  return (
    <ResponsiveColumns columns={{ xs: 1, md: 2 }} gap={2.5}>
      <ChartCardShimmer variant="line" titleWidth="48%" />
      <ChartCardShimmer variant="bar" titleWidth="62%" />
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
