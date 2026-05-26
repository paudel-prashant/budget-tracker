"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetHealthWidget } from "@/components/dashboard/budget-health-widget";
import { BudgetWarnings } from "@/components/dashboard/budget-warnings";
import { DashboardChartsLazy } from "@/components/dashboard/dashboard-charts-lazy";
import { DashboardDateRangeSelector } from "@/components/dashboard/dashboard-date-range-selector";
import { DashboardGettingStarted } from "@/components/dashboard/dashboard-getting-started";
import { DashboardMetricsTransition } from "@/components/dashboard/dashboard-metrics-transition";
import { DashboardInsightsWidget } from "@/components/dashboard/dashboard-insights-widget";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { DashboardCustomizeDialog } from "@/components/dashboard/dashboard-customize-dialog";
import {
  DashboardWidgetGrid,
  usePersistDashboardLayout,
} from "@/components/dashboard/dashboard-widget-grid";
import {
  normalizeDashboardLayout,
  type DashboardLayoutPreferences,
  type DashboardWidgetId,
} from "@/lib/domain/dashboard-layout";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import type { DashboardData, DashboardMetrics } from "@/lib/types";

type DashboardViewProps = {
  data: DashboardData;
  initialLayout: DashboardLayoutPreferences;
};

function metricsFromDashboardData(data: DashboardData): DashboardMetrics {
  return {
    summary: data.summary,
    balanceChartData: data.balanceChartData,
    monthlyChartData: data.monthlyChartData,
    insights: data.insights,
    kpis: data.kpis,
    dateRange: data.dateRange,
  };
}

export function DashboardView({ data, initialLayout }: DashboardViewProps) {
  const [layout, setLayout] = useState(() => normalizeDashboardLayout(initialLayout));
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const initialMetrics = useMemo(() => metricsFromDashboardData(data), [data]);
  const { metrics, loading: metricsLoading, error: metricsError, applyRange, clearError } =
    useDashboardMetrics({ initialMetrics });

  const initialSerialized = useMemo(() => JSON.stringify(initialLayout), [initialLayout]);
  const { saving } = usePersistDashboardLayout(layout, initialSerialized);

  const hasNoActivity =
    metrics.summary.totalIncome === 0 &&
    metrics.summary.totalExpenses === 0 &&
    metrics.balanceChartData.length === 0;

  const handleLayoutChange = useCallback((next: DashboardLayoutPreferences) => {
    setLayout(next);
  }, []);

  const renderWidget = useCallback(
    (id: DashboardWidgetId) => {
      const metricsContent = (content: ReactNode) => (
        <DashboardMetricsTransition loading={metricsLoading}>{content}</DashboardMetricsTransition>
      );

      switch (id) {
        case "balance":
          return metricsContent(
            <SummaryCards summary={metrics.summary} dimmed={metricsLoading} />
          );
        case "kpis":
          return metricsContent(
            <DashboardKpiCards kpis={metrics.kpis} dimmed={metricsLoading} />
          );
        case "charts":
          return metricsContent(
            <DashboardChartsLazy
              balanceChartData={metrics.balanceChartData}
              monthlyChartData={metrics.monthlyChartData}
              embedded
            />
          );
        case "budgets":
          return (
            <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
              <BudgetWarnings
                warnings={data.budgetWarnings}
                month={data.budgetHealth.month}
                year={data.budgetHealth.year}
              />
              <BudgetHealthWidget health={data.budgetHealth} embedded />
            </Stack>
          );
        case "goals":
          return metricsContent(
            <GoalsWidget
              summary={metrics.summary}
              health={data.budgetHealth}
              insights={metrics.insights}
              embedded
            />
          );
        case "insights":
          return metricsContent(
            metrics.insights ? (
              <DashboardInsightsWidget insights={metrics.insights} embedded />
            ) : (
              <Alert severity="info" variant="outlined">
                Add more transactions to unlock personalized insights.
              </Alert>
            )
          );
        default:
          return null;
      }
    },
    [data.budgetHealth, data.budgetWarnings, metrics, metricsLoading]
  );

  return (
    <PageStack>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity. Use the date range filter to analyze any period."
        action={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {saving && (
              <Chip
                size="small"
                icon={<CircularProgress size={14} color="inherit" />}
                label="Saving layout…"
                variant="outlined"
              />
            )}
            <Button
              variant={customizeMode ? "contained" : "outlined"}
              startIcon={<TuneOutlinedIcon />}
              onClick={() => {
                setCustomizeMode((prev) => !prev);
                if (customizeMode) setCustomizeOpen(false);
              }}
            >
              {customizeMode ? "Done customizing" : "Customize"}
            </Button>
            <Button variant="text" onClick={() => setCustomizeOpen(true)}>
              Widgets
            </Button>
          </Stack>
        }
      />

      {customizeMode && (
        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            Drag the handle on each widget to reorder. Use the eye icon or Widgets menu to show or
            hide sections. Changes save automatically.
          </Typography>
        </Alert>
      )}

      {metricsError && (
        <Alert severity="error" variant="outlined" onClose={clearError}>
          {metricsError}
        </Alert>
      )}

      <DashboardDateRangeSelector
        value={metrics.dateRange}
        loading={metricsLoading}
        onChange={applyRange}
      />

      {hasNoActivity && <DashboardGettingStarted />}

      <DashboardWidgetGrid
        layout={layout}
        customizeMode={customizeMode}
        onLayoutChange={handleLayoutChange}
        renderWidget={renderWidget}
      />

      <DashboardCustomizeDialog
        open={customizeOpen}
        layout={layout}
        onClose={() => setCustomizeOpen(false)}
        onChange={handleLayoutChange}
      />
    </PageStack>
  );
}
