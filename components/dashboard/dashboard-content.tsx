import { PageHeader } from "@/components/ui/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import type { DashboardData } from "@/lib/types";

type DashboardContentProps = {
  data: DashboardData;
};

export function DashboardContent({ data }: DashboardContentProps) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity and trends."
      />
      <SummaryCards summary={data.summary} />
      <DashboardCharts
        balanceChartData={data.balanceChartData}
        monthlyChartData={data.monthlyChartData}
      />
    </>
  );
}
