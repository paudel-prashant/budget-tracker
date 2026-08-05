"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StatCard } from "@/components/shared/ui/stat-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { GoalFormDialog } from "@/components/dashboard/goal-form-dialog";
import { DeleteGoalDialog } from "@/components/dashboard/delete-goal-dialog";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { widgetContentTitleSx, widgetLabelSx } from "@/lib/theme/typography";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import type { BudgetHealth, DashboardInsights, Goal, Summary } from "@/lib/types";

type GoalsWidgetProps = {
  summary: Summary;
  health: BudgetHealth;
  insights: DashboardInsights | null;
  embedded?: boolean;
};

const SAVINGS_GOAL_RATE = 20;

export function GoalsWidget({ summary, health, insights, embedded = false }: GoalsWidgetProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoadingGoals(true);
    try {
      const response = await fetch("/api/goals");
      if (!response.ok) return;
      const data: Goal[] = await response.json();
      setGoals(data);
    } catch {
      // Non-critical widget data — fail quietly, the rest of the dashboard still works.
    } finally {
      setLoadingGoals(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddClick = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEditClick = (goal: Goal) => {
    setEditTarget(goal);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleFormSuccess = async () => {
    const wasEditing = Boolean(editTarget);
    await loadGoals();
    showSuccess(wasEditing ? "Goal updated" : "Goal added");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/goals/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete goal");
      }
      setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      showSuccess("Goal deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete goal");
    } finally {
      setDeleting(false);
    }
  };

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
              <Typography sx={widgetLabelSx}>Goals</Typography>
            </Stack>
          )}
          <Typography sx={widgetContentTitleSx}>Progress toward your targets</Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddOutlinedIcon fontSize="small" />}
          onClick={handleAddClick}
          sx={{ alignSelf: { sm: "center" }, flexShrink: 0 }}
        >
          Add goal
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

      {!loadingGoals && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
            Your savings goals
          </Typography>

          {goals.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No goals yet — add one to track progress toward something specific, like an
              emergency fund or a trip.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {goals.map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100))
                    : 0;
                const achieved = goal.currentAmount >= goal.targetAmount;

                return (
                  <Box key={goal.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {goal.name}
                          {goal.category ? ` · ${goal.category}` : ""}
                        </Typography>
                        {goal.targetDate && (
                          <Typography variant="caption" color="text.secondary">
                            Target: {formatDate(goal.targetDate)}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.25} flexShrink={0}>
                        <Tooltip title="Edit goal">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(goal)}
                            aria-label={`Edit ${goal.name}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete goal">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(goal)}
                            aria-label={`Delete ${goal.name}`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Typography>
                      <Typography variant="caption" color={achieved ? "success.main" : "text.secondary"} fontWeight={achieved ? 700 : 400}>
                        {achieved ? "Goal reached! 🎉" : formatPercent(progress)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={achieved ? "success" : "primary"}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(
                          achieved ? theme.palette.success.main : theme.palette.primary.main,
                          0.12
                        ),
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      )}
    </>
  );

  return (
    <>
      {embedded ? (
        <Box sx={{ width: "100%", minWidth: 0 }}>{content}</Box>
      ) : (
        <SurfaceCard sx={{ p: CARD_PADDING, width: "100%" }}>{content}</SurfaceCard>
      )}

      <GoalFormDialog open={formOpen} goal={editTarget} onClose={closeForm} onSuccess={handleFormSuccess} />

      <DeleteGoalDialog
        goal={deleteTarget}
        open={Boolean(deleteTarget)}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
