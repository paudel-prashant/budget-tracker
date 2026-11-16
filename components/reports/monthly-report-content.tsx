"use client";

import { useCallback, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { ReportMoneySplit } from "@/components/reports/report-money-split";
import { HeroBanner } from "@/components/shared/ui/viz/hero-banner";
import { MiniStat } from "@/components/shared/ui/viz/mini-stat";
import { RankedBars } from "@/components/shared/ui/viz/ranked-bars";
import { CalendarHeatmap } from "@/components/shared/ui/viz/calendar-heatmap";
import { VizCard } from "@/components/shared/ui/viz/viz-card";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { APP_NAME } from "@/lib/config/app";
import { downloadMonthlyReportPdf } from "@/lib/services/export-monthly-report-pdf";
import { formatCurrency, formatDate, formatMonth, formatPercent } from "@/lib/utils/format";
import type { MonthlyReport, MonthlyReportResponse } from "@/lib/types";

type MonthlyReportContentProps = {
  initial: MonthlyReportResponse;
};

function ChangeLabel({
  value,
  label,
  positiveIsGood = true,
}: {
  value: number | null;
  label: string;
  positiveIsGood?: boolean;
}) {
  if (value === null) {
    return (
      <Typography variant="caption" color="text.secondary">
        {label}: —
      </Typography>
    );
  }

  const isUp = value > 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const Icon = isUp ? TrendingUpOutlinedIcon : TrendingDownOutlinedIcon;
  const color =
    value === 0 ? "text.secondary" : isGood ? "success.main" : "error.main";

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Icon sx={{ fontSize: 14, color }} />
      <Typography variant="caption" sx={{ color }}>
        {label}: {value > 0 ? "+" : ""}
        {formatPercent(value)} vs prior month
      </Typography>
    </Stack>
  );
}

export function MonthlyReportContent({ initial }: MonthlyReportContentProps) {
  const theme = useTheme();
  const { showError, showSuccess } = useSnackbar();

  const [report, setReport] = useState<MonthlyReport>(initial.report);
  const [availableMonths, setAvailableMonths] = useState(initial.availableMonths);
  const [selectedMonth, setSelectedMonth] = useState(initial.report.month);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadReport = useCallback(
    async (month: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/monthly?month=${encodeURIComponent(month)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to load report");
        }
        const payload: MonthlyReportResponse = await response.json();
        setReport(payload.report);
        setAvailableMonths(payload.availableMonths);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    loadReport(month);
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadMonthlyReportPdf(report);
      showSuccess("Report PDF downloaded");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageStack>
      <PageHeader
        title="Monthly Reports"
        description="Professional summaries of income, spending, savings, and category trends."
        action={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <FormControl size="small" sx={{ minWidth: { sm: 200 } }}>
              <InputLabel id="report-month-label">Month</InputLabel>
              <Select
                labelId="report-month-label"
                label="Month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                disabled={loading}
              >
                {availableMonths.map((month) => (
                  <MenuItem key={month} value={month}>
                    {formatMonth(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={
                exportingPdf ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <PictureAsPdfOutlinedIcon />
                )
              }
              onClick={handleDownloadPdf}
              disabled={loading || exportingPdf}
              sx={{ minWidth: { sm: 160 } }}
            >
              Download PDF
            </Button>
          </Stack>
        }
      />

      <SurfaceCard
        id="monthly-report-document"
        sx={{
          overflow: "hidden",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.2s ease",
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 2.5, sm: 3 },
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 55%)`,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                {APP_NAME} report
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {report.monthLabelLong}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Generated {formatDate(report.generatedAt)} · {report.summary.transactionCount}{" "}
                transaction{report.summary.transactionCount === 1 ? "" : "s"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <DownloadOutlinedIcon fontSize="small" />
              <Typography variant="caption">Export includes summary tables and category breakdowns</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <HeroBanner
            eyebrow={`Saved in ${report.monthLabel}`}
            icon={SavingsOutlinedIcon}
            tone={report.summary.savings >= 0 ? "success" : "error"}
            value={report.summary.savings}
            format={formatCurrency}
            delta={
              report.comparison.savingsChangePercent !== null
                ? {
                    label: `${report.comparison.savingsChangePercent > 0 ? "+" : ""}${formatPercent(report.comparison.savingsChangePercent)} vs ${report.comparison.previousMonthLabel}`,
                    direction:
                      report.comparison.savingsChangePercent > 0
                        ? "up"
                        : report.comparison.savingsChangePercent < 0
                          ? "down"
                          : "flat",
                    sentiment:
                      report.comparison.savingsChangePercent > 0
                        ? "good"
                        : report.comparison.savingsChangePercent < 0
                          ? "bad"
                          : "neutral",
                  }
                : null
            }
            caption={
              report.summary.savingsRate !== null
                ? `Savings rate ${formatPercent(report.summary.savingsRate)}`
                : undefined
            }
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <Box>
                <MiniStat icon={TrendingUpOutlinedIcon} label="Income" value={formatCurrency(report.summary.totalIncome)} color="success.main" />
                <ChangeLabel label="Income" value={report.comparison.incomeChangePercent} />
              </Box>
              <Box>
                <MiniStat icon={TrendingDownOutlinedIcon} label="Expenses" value={formatCurrency(report.summary.totalExpenses)} color="error.main" />
                <ChangeLabel label="Expenses" value={report.comparison.expenseChangePercent} positiveIsGood={false} />
              </Box>
              <MiniStat
                icon={AccountBalanceWalletOutlinedIcon}
                label="Transactions"
                value={String(report.summary.transactionCount)}
                color="primary.main"
              />
            </Box>
          </HeroBanner>

          <Box sx={{ mt: 3 }}>
            <ResponsiveColumns templateColumns={{ xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1.4fr)" }}>
              <ReportMoneySplit
                income={report.charts.incomeVsExpenses.income}
                expenses={report.charts.incomeVsExpenses.expenses}
              />
              <VizCard title="Daily spending" subtitle="Each day shaded by how much you spent">
                <CalendarHeatmap
                  month={report.month}
                  days={report.charts.dailyExpenses}
                  format={formatCurrency}
                />
              </VizCard>
            </ResponsiveColumns>
          </Box>

          <Box sx={{ mt: 3 }}>
            <ResponsiveColumns columns={{ xs: 1, md: 2 }}>
              <VizCard title="Top expense categories" subtitle="Ranked by total spent">
                <RankedBars
                  format={formatCurrency}
                  color={theme.palette.error.main}
                  emptyMessage="No expenses recorded this month."
                  items={report.topExpenseCategories.map((row) => ({
                    key: row.category,
                    label: row.category,
                    value: row.amount,
                    detail: `${row.transactionCount} transaction${row.transactionCount === 1 ? "" : "s"}`,
                  }))}
                />
              </VizCard>
              <VizCard title="Top income categories" subtitle="Ranked by total received">
                <RankedBars
                  format={formatCurrency}
                  color={theme.palette.success.main}
                  emptyMessage="No income recorded this month."
                  items={report.topIncomeCategories.map((row) => ({
                    key: row.category,
                    label: row.category,
                    value: row.amount,
                    detail: `${row.transactionCount} transaction${row.transactionCount === 1 ? "" : "s"}`,
                  }))}
                />
              </VizCard>
            </ResponsiveColumns>
          </Box>
        </Box>
      </SurfaceCard>
    </PageStack>
  );
}
