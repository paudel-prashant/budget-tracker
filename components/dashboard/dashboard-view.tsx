"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetHealthWidget } from "@/components/dashboard/budget-health-widget";
import { BudgetWarnings } from "@/components/dashboard/budget-warnings";
import { DashboardChartsLazy } from "@/components/dashboard/dashboard-charts-lazy";
import { DashboardGettingStarted } from "@/components/dashboard/dashboard-getting-started";
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
import type { DashboardData } from "@/lib/types";

type DashboardViewProps = {
  data: DashboardData;
  initialLayout: DashboardLayoutPreferences;
};

export function DashboardView({ data, initialLayout }: DashboardViewProps) {
  const [layout, setLayout] = useState(() => normalizeDashboardLayout(initialLayout));
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const initialSerialized = useMemo(() => JSON.stringify(initialLayout), [initialLayout]);
  const { saving } = usePersistDashboardLayout(layout, initialSerialized);

  const hasNoActivity =
    data.summary.totalIncome === 0 &&
    data.summary.totalExpenses === 0 &&
    data.balanceChartData.length === 0;

  const handleLayoutChange = useCallback((next: DashboardLayoutPreferences) => {
    setLayout(next);
  }, []);

  const renderWidget = useCallback(
    (id: DashboardWidgetId) => {
      switch (id) {
        case "balance":
          return <SummaryCards summary={data.summary} />;
        case "charts":
          return (
            <DashboardChartsLazy
              balanceChartData={data.balanceChartData}
              monthlyChartData={data.monthlyChartData}
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
          return (
            <GoalsWidget
              summary={data.summary}
              health={data.budgetHealth}
              insights={data.insights}
              embedded
            />
          );
        case "insights":
          return data.insights ? (
            <DashboardInsightsWidget insights={data.insights} embedded />
          ) : (
            <Alert severity="info" variant="outlined">
              Add more transactions to unlock personalized insights.
            </Alert>
          );
        default:
          return null;
      }
    },
    [data]
  );

  return (
    <PageStack>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity and trends."
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
