"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { EmptyState } from "@/components/shared/ui/empty-state";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { BudgetHistoryPanel } from "@/components/budget/budget-history-panel";
import { MonthNavigator } from "@/components/shared/ui/month-navigator";
import { DeleteBudgetDialog } from "@/components/budget/delete-budget-dialog";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { compareMonthYear, getCurrentMonthYear } from "@/lib/domain/budget-calculations";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatMonthYear } from "@/lib/utils/format";
import type { BudgetHistoryMonth, BudgetWithProgress, CopyBudgetsResult } from "@/lib/types";

type MonthYear = { month: number; year: number };

type BudgetsResponse = {
  month: number;
  year: number;
  budgets: BudgetWithProgress[];
};

type HistoryResponse = {
  history: BudgetHistoryMonth[];
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function BudgetView() {
  const { showSuccess, showError } = useSnackbar();

  const [selected, setSelected] = useState<MonthYear>(getCurrentMonthYear);
  const { month, year } = selected;
  const selectedLabel = formatMonthYear(month, year);
  const isCurrentMonth = compareMonthYear(selected, getCurrentMonthYear()) === 0;

  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [history, setHistory] = useState<BudgetHistoryMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetWithProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithProgress | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);

  // Switching months quickly can resolve requests out of order — only the latest wins.
  const requestIdRef = useRef(0);

  const loadBudgets = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const [budgetsResponse, historyResponse] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch("/api/budgets/history"),
      ]);

      if (!budgetsResponse.ok) {
        throw new Error(await readError(budgetsResponse, "Failed to load budgets"));
      }

      const data: BudgetsResponse = await budgetsResponse.json();
      // History is a convenience — the page still works if it fails to load.
      const historyData: HistoryResponse | null = historyResponse.ok
        ? await historyResponse.json()
        : null;

      if (requestId !== requestIdRef.current) return;

      setBudgets(data.budgets);
      setHistory(historyData?.history ?? []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [month, year, showError]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  /**
   * The month an empty month should be pre-filled from: the most recent earlier month
   * with budgets, falling back to the newest month on record.
   */
  const suggestedSource = useMemo(
    () =>
      history.find((entry) => compareMonthYear(entry, selected) < 0) ??
      history.find((entry) => compareMonthYear(entry, selected) !== 0) ??
      null,
    [history, selected]
  );

  const handleFormSuccess = async () => {
    const wasEditing = Boolean(editTarget);
    await loadBudgets();
    showSuccess(wasEditing ? "Budget updated successfully" : "Budget created successfully");
  };

  const handleAddClick = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEditClick = (budget: BudgetWithProgress) => {
    setEditTarget(budget);
    setDialogOpen(true);
  };

  const closeForm = () => {
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleCopy = async (from: MonthYear) => {
    setCopying(true);

    try {
      const response = await fetch("/api/budgets/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: selected }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to copy budgets"));
      }

      const result: CopyBudgetsResult = await response.json();
      const fromLabel = formatMonthYear(from.month, from.year);

      if (result.created === 0) {
        showSuccess(`${selectedLabel} already has every budget from ${fromLabel}`);
      } else {
        const skippedNote =
          result.skipped > 0 ? ` (${result.skipped} already set, kept as-is)` : "";
        showSuccess(
          `Copied ${result.created} ${result.created === 1 ? "budget" : "budgets"} from ${fromLabel}${skippedNote}`
        );
        await loadBudgets();
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to copy budgets");
    } finally {
      setCopying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/budgets/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to delete budget"));
      }

      setDeleteTarget(null);
      showSuccess("Budget deleted");
      await loadBudgets();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete budget");
    } finally {
      setDeleting(false);
    }
  };

  const knownCategories = useMemo(() => {
    const categories = new Set(budgets.map((budget) => budget.category));
    for (const entry of history) {
      for (const category of entry.categories) categories.add(category);
    }
    return [...categories];
  }, [budgets, history]);

  const copyButtonContent = (source: BudgetHistoryMonth) =>
    `Copy ${source.budgetCount} ${source.budgetCount === 1 ? "budget" : "budgets"} from ${formatMonthYear(source.month, source.year)}`;

  return (
    <PageStack>
      <PageHeader
        title="Budget"
        description={`Category spending limits and progress for ${selectedLabel}.`}
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={handleAddClick}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Add Budget
          </Button>
        }
      />

      <Box sx={{ mb: 2 }}>
        <MonthNavigator value={selected} onChange={setSelected} disabled={copying} />
      </Box>

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
      ) : budgets.length === 0 && suggestedSource ? (
        <SectionPanel>
          <Stack spacing={2} alignItems="center" sx={{ p: CARD_PADDING, py: { xs: 5, sm: 6 }, textAlign: "center" }}>
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h6">No budgets for {selectedLabel} yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
              Pick up where you left off — reuse your{" "}
              {formatMonthYear(suggestedSource.month, suggestedSource.year)} budgets (
              {suggestedSource.categories.slice(0, 4).join(", ")}
              {suggestedSource.categories.length > 4 ? ", …" : ""}) and tweak any limits afterwards.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="contained"
                size="large"
                disabled={copying}
                onClick={() => handleCopy(suggestedSource)}
                startIcon={
                  copying ? <CircularProgress size={16} color="inherit" /> : <ContentCopyOutlinedIcon />
                }
              >
                {copyButtonContent(suggestedSource)}
              </Button>
              <Button size="large" disabled={copying} onClick={handleAddClick}>
                Start from scratch
              </Button>
            </Stack>
          </Stack>
        </SectionPanel>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={AccountBalanceWalletOutlinedIcon}
          title="No budgets yet"
          description="Set monthly limits by category to track spending and stay on target."
          actionLabel="Add Budget"
          onAction={handleAddClick}
        />
      ) : (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditClick}
              onDelete={setDeleteTarget}
            />
          ))}
        </ResponsiveColumns>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Spent amounts include expense transactions in this category for{" "}
          {isCurrentMonth ? "the current calendar month" : selectedLabel}.
        </Typography>
      </Box>

      {!loading && (
        <BudgetHistoryPanel
          history={history}
          selected={selected}
          copying={copying}
          onView={(value) => setSelected({ month: value.month, year: value.year })}
          onCopy={handleCopy}
        />
      )}

      <BudgetFormDialog
        open={dialogOpen}
        budget={editTarget}
        month={month}
        year={year}
        extraCategories={knownCategories}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
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
