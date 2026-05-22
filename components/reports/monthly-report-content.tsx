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
import { CategorySpendingChart } from "@/components/insights/category-spending-chart";
import { ReportCategoryTable } from "@/components/reports/report-category-table";
import { ReportDailySpendingChart } from "@/components/reports/report-daily-spending-chart";
import { ReportMonthSummaryChart } from "@/components/reports/report-month-summary-chart";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StatCard } from "@/components/shared/ui/stat-card";
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

  const savingsTint =
    report.summary.savings >= 0 ? ("success" as const) : ("error" as const);

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
          <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }}>
            <StatCard
              title="Total income"
              value={formatCurrency(report.summary.totalIncome)}
              icon={TrendingUpOutlinedIcon}
              tint="success"
            />
            <StatCard
              title="Total expenses"
              value={formatCurrency(report.summary.totalExpenses)}
              icon={TrendingDownOutlinedIcon}
              tint="error"
            />
            <StatCard
              title="Savings"
              value={formatCurrency(report.summary.savings)}
              icon={SavingsOutlinedIcon}
              tint={savingsTint}
            />
            <StatCard
              title="Savings rate"
              value={
                report.summary.savingsRate !== null
                  ? formatPercent(report.summary.savingsRate)
                  : "—"
              }
              icon={AccountBalanceWalletOutlinedIcon}
              tint="primary"
            />
          </ResponsiveColumns>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Compared to {report.comparison.previousMonthLabel}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
              <ChangeLabel label="Income" value={report.comparison.incomeChangePercent} />
              <ChangeLabel
                label="Expenses"
                value={report.comparison.expenseChangePercent}
                positiveIsGood={false}
              />
              <ChangeLabel label="Savings" value={report.comparison.savingsChangePercent} />
            </Stack>
          </Box>

          <Box sx={{ mt: 3 }}>
            <ResponsiveColumns columns={{ xs: 1, lg: 2 }}>
              <ReportMonthSummaryChart
                monthLabel={report.monthLabel}
                income={report.charts.incomeVsExpenses.income}
                expenses={report.charts.incomeVsExpenses.expenses}
              />
              <CategorySpendingChart data={report.charts.expenseByCategory} />
            </ResponsiveColumns>
          </Box>

          <Box sx={{ mt: 3 }}>
            <ReportDailySpendingChart data={report.charts.dailyExpenses} />
          </Box>

          <Box sx={{ mt: 3 }}>
            <ResponsiveColumns columns={{ xs: 1, md: 2 }}>
              <ReportCategoryTable
                title="Top expense categories"
                subtitle="Ranked by total spent"
                rows={report.topExpenseCategories}
              />
              <ReportCategoryTable
                title="Top income categories"
                subtitle="Ranked by total received"
                rows={report.topIncomeCategories}
                emptyMessage="No income recorded this month."
              />
            </ResponsiveColumns>
          </Box>
        </Box>
      </SurfaceCard>
    </PageStack>
  );
}
