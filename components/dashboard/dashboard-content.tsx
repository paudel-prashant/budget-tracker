import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetHealthWidget } from "@/components/dashboard/budget-health-widget";
import { BudgetWarnings } from "@/components/dashboard/budget-warnings";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardGettingStarted } from "@/components/dashboard/dashboard-getting-started";
import { DashboardInsightsWidget } from "@/components/dashboard/dashboard-insights-widget";
import { NetWorthWidget } from "@/components/dashboard/net-worth-widget";
import type { DashboardData } from "@/lib/types";

type DashboardContentProps = {
  data: DashboardData;
};

export function DashboardContent({ data }: DashboardContentProps) {
  const hasNoActivity =
    data.summary.totalIncome === 0 &&
    data.summary.totalExpenses === 0 &&
    data.balanceChartData.length === 0;

  return (
    <PageStack>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity and trends."
      />
      {hasNoActivity && <DashboardGettingStarted />}
      <BudgetWarnings
        warnings={data.budgetWarnings}
        month={data.budgetHealth.month}
        year={data.budgetHealth.year}
      />
      <SummaryCards summary={data.summary} />
      {data.insights && <DashboardInsightsWidget insights={data.insights} />}
      <NetWorthWidget data={data.netWorth} />
      <BudgetHealthWidget health={data.budgetHealth} />
      <DashboardCharts
        balanceChartData={data.balanceChartData}
        monthlyChartData={data.monthlyChartData}
      />
    </PageStack>
  );
}
