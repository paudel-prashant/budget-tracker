"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StatCard } from "@/components/shared/ui/stat-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { BudgetHealth, DashboardInsights, Summary } from "@/lib/types";

type GoalsWidgetProps = {
  summary: Summary;
  health: BudgetHealth;
  insights: DashboardInsights | null;
  embedded?: boolean;
};

const SAVINGS_GOAL_RATE = 20;

export function GoalsWidget({ summary, health, insights, embedded = false }: GoalsWidgetProps) {
  const theme = useTheme();
  const monthlyIncome = insights?.totalIncome ?? summary.totalIncome;
  const monthlySavings = insights?.latestMonthSavings ?? summary.netBalance;
  const savingsGoalAmount =
    monthlyIncome > 0 ? Math.round(((monthlyIncome * SAVINGS_GOAL_RATE) / 100) * 100) / 100 : 0;
  const savingsProgress =
    savingsGoalAmount > 0
      ? Math.min(100, Math.max(0, (monthlySavings / savingsGoalAmount) * 100))
      : 0;
  const budgetGoalProgress =
    health.totalBudgets > 0
      ? Math.round((health.onTrack / health.totalBudgets) * 100)
      : null;

  const content = (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          {!embedded && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <FlagOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="overline" color="text.secondary">
                Goals
              </Typography>
            </Stack>
          )}
          <Typography variant="h6" fontWeight={700}>
            Progress toward your targets
          </Typography>
        </Box>
        <Button
          component={NextLink}
          href="/budget"
          size="small"
          variant="outlined"
          endIcon={<ArrowForwardOutlinedIcon />}
          sx={{ alignSelf: { sm: "center" }, flexShrink: 0 }}
        >
          Manage budgets
        </Button>
      </Stack>

      <ResponsiveColumns columns={{ xs: 1, sm: 2 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Monthly savings ({SAVINGS_GOAL_RATE}% of income)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(monthlySavings)} / {formatCurrency(savingsGoalAmount)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={savingsProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {monthlyIncome > 0
              ? `${formatPercent(savingsProgress)} of savings goal`
              : "Add income transactions to track a savings goal"}
          </Typography>
        </Box>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Budgets on track
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {health.onTrack} / {health.totalBudgets || "—"}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={budgetGoalProgress ?? 0}
            color={budgetGoalProgress !== null && budgetGoalProgress >= 80 ? "success" : "primary"}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(theme.palette.success.main, 0.12),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {health.totalBudgets > 0
              ? `${formatPercent(budgetGoalProgress ?? 0)} of categories within limit`
              : "Create budgets to track category goals"}
          </Typography>
        </Box>
      </ResponsiveColumns>

      <Box sx={{ mt: 2.5 }}>
        <ResponsiveColumns columns={{ xs: 1, sm: 3 }}>
        <StatCard
          title="Net balance"
          value={formatCurrency(summary.netBalance)}
          icon={SavingsOutlinedIcon}
          tint={summary.netBalance >= 0 ? "success" : "error"}
        />
        <StatCard
          title="Budgets on track"
          value={String(health.onTrack)}
          icon={AccountBalanceWalletOutlinedIcon}
          tint="primary"
        />
        <StatCard
          title="Savings goal"
          value={formatPercent(SAVINGS_GOAL_RATE)}
          icon={FlagOutlinedIcon}
          tint="primary"
        />
        </ResponsiveColumns>
      </Box>
    </>
  );

  if (embedded) {
    return <Box sx={{ width: "100%", minWidth: 0 }}>{content}</Box>;
  }

  return <SurfaceCard sx={{ p: CARD_PADDING, width: "100%" }}>{content}</SurfaceCard>;
}
