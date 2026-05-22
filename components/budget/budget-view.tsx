"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";
import { EmptyState } from "@/components/ui/empty-state";
import { BudgetCard } from "@/components/budget/budget-card";
import { AddBudgetDialog } from "@/components/budget/add-budget-dialog";
import { DeleteBudgetDialog } from "@/components/budget/delete-budget-dialog";
import { useSnackbar } from "@/components/providers/snackbar-provider";
import { getCurrentMonthYear } from "@/lib/budget-calculations";
import { formatMonthYear } from "@/lib/format";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetsResponse = {
  month: number;
  year: number;
  budgets: BudgetWithProgress[];
};

export function BudgetView() {
  const { showSuccess, showError } = useSnackbar();
  const { month, year } = getCurrentMonthYear();

  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithProgress | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budgets?month=${month}&year=${year}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to load budgets");
      }

      const data: BudgetsResponse = await response.json();
      setBudgets(data.budgets);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [month, year, showError]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleCreateSuccess = async () => {
    await loadBudgets();
    showSuccess("Budget created successfully");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/budgets/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete budget");
      }

      setBudgets((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      showSuccess("Budget deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete budget");
    } finally {
      setDeleting(false);
    }
  };

  const knownCategories = useMemo(
    () => budgets.map((budget) => budget.category),
    [budgets]
  );

  return (
    <PageStack>
      <PageHeader
        title="Budget"
        description={`Category spending limits and progress for ${formatMonthYear(month, year)}.`}
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Add Budget
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={220} />
          ))}
        </ResponsiveColumns>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={AccountBalanceWalletOutlinedIcon}
          title="No budgets yet"
          description="Set monthly limits by category to track spending and stay on target."
          actionLabel="Add Budget"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onDelete={setDeleteTarget} />
          ))}
        </ResponsiveColumns>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Spent amounts include expense transactions in this category for the current calendar
          month.
        </Typography>
      </Box>

      <AddBudgetDialog
        open={dialogOpen}
        extraCategories={knownCategories}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteBudgetDialog
        budget={deleteTarget}
        open={!!deleteTarget}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageStack>
  );
}
