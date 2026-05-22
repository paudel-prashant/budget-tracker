import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetHealthWidget } from "@/components/dashboard/budget-health-widget";
import { BudgetWarnings } from "@/components/dashboard/budget-warnings";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardGettingStarted } from "@/components/dashboard/dashboard-getting-started";
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
    <PageStack spacing={2.5}>
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
      <BudgetHealthWidget health={data.budgetHealth} />
      <DashboardCharts
        balanceChartData={data.balanceChartData}
        monthlyChartData={data.monthlyChartData}
      />
    </PageStack>
  );
}
