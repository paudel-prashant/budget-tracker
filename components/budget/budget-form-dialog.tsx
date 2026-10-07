"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CategorySelectField } from "@/components/shared/ui/category-select-field";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { formatCurrency, formatMonthYear } from "@/lib/utils/format";
import type { BudgetSuggestion } from "@/lib/domain/budget-suggestions";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetFormDialogProps = {
  open: boolean;
  budget?: BudgetWithProgress | null;
  /** Month/year a new budget is created for (edits always keep the budget's own month). */
  month: number;
  year: number;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type FormState = {
  category: string;
  monthlyLimit: string;
  rolloverEnabled: boolean;
};

const emptyForm = (): FormState => ({
  category: "",
  monthlyLimit: "",
  rolloverEnabled: false,
});

function formFromBudget(budget: BudgetWithProgress): FormState {
  return {
    category: budget.category,
    monthlyLimit: String(budget.monthlyLimit),
    rolloverEnabled: budget.rolloverEnabled,
  };
}

export function BudgetFormDialog({
  open,
  budget,
  month,
  year,
  extraCategories = [],
  onClose,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEdit = Boolean(budget);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  // The limit the form last pre-filled itself; while the field still holds it, picking
  // another category may replace it. Anything the user typed is never overwritten.
  const autoFilledLimitRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(budget ? formFromBudget(budget) : emptyForm());
    setError(null);
    autoFilledLimitRef.current = null;
  }, [open, budget]);

  const targetMonth = budget?.month ?? month;
  const targetYear = budget?.year ?? year;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Suggestions are a convenience; the form works the same without them.
    fetch(`/api/budgets/suggestions?month=${targetMonth}&year=${targetYear}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { suggestions: BudgetSuggestion[] } | null) => {
        if (!cancelled) setSuggestions(data?.suggestions ?? []);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [open, targetMonth, targetYear]);

  const selectedCategory = (budget?.category ?? form.category).trim().toLowerCase();
  const suggestion = selectedCategory
    ? suggestions.find((item) => item.category.toLowerCase() === selectedCategory) ?? null
    : null;

  const applySuggestedLimit = (value: BudgetSuggestion) => {
    const limit = String(value.suggestedLimit);
    autoFilledLimitRef.current = limit;
    setForm((prev) => ({ ...prev, monthlyLimit: limit }));
  };

  const handleCategoryChange = (category: string) => {
    setForm((prev) => {
      const match = suggestions.find(
        (item) => item.category.toLowerCase() === category.trim().toLowerCase()
      );
      const limitIsUntouched =
        prev.monthlyLimit === "" || prev.monthlyLimit === autoFilledLimitRef.current;

      if (match && limitIsUntouched) {
        const limit = String(match.suggestedLimit);
        autoFilledLimitRef.current = limit;
        return { ...prev, category, monthlyLimit: limit };
      }
      return { ...prev, category };
    });
  };

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const monthlyLimit = Number(form.monthlyLimit);

    if ((!isEdit && !form.category.trim()) || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      setError("Please enter a category and a positive monthly limit.");
      setSubmitting(false);
      return;
    }

    const payload = isEdit
      ? { monthlyLimit, rolloverEnabled: form.rolloverEnabled }
      : {
          category: form.category.trim(),
          monthlyLimit,
          rolloverEnabled: form.rolloverEnabled,
          month,
          year,
        };

    try {
      const response = await fetch(
        isEdit ? `/api/budgets/${budget!.id}` : "/api/budgets",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? (isEdit ? "Failed to update budget" : "Failed to create budget"));
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : isEdit ? "Failed to update budget" : "Failed to create budget"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      sx={{ "& .MuiDialog-paper": { m: { xs: 2, sm: 3 } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEdit ? "Edit Budget" : "Add Category Budget"}
          <Typography variant="body2" color="text.secondary">
            {formatMonthYear(budget?.month ?? month, budget?.year ?? year)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {isEdit ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {budget!.category}
                </Typography>
              </Box>
            ) : (
              <CategorySelectField
                value={form.category}
                onChange={handleCategoryChange}
                extraCategories={extraCategories}
                transactionType="EXPENSE"
              />
            )}

            <TextField
              {...formTextFieldProps}
              label="Monthly limit"
              type="number"
              value={form.monthlyLimit}
              onChange={(e) => setForm((prev) => ({ ...prev, monthlyLimit: e.target.value }))}
              slotProps={{
                ...formTextFieldProps.slotProps,
                htmlInput: { min: 0, step: "0.01" },
              }}
              required
            />

            {suggestion && (
              <Alert
                severity="info"
                variant="outlined"
                action={
                  form.monthlyLimit !== String(suggestion.suggestedLimit) ? (
                    <Button color="inherit" size="small" onClick={() => applySuggestedLimit(suggestion)}>
                      Use {formatCurrency(suggestion.suggestedLimit)}
                    </Button>
                  ) : undefined
                }
              >
                You&apos;ve averaged {formatCurrency(suggestion.averageMonthly)} on{" "}
                {suggestion.category} over the last{" "}
                {suggestion.monthsCounted === 1 ? "month" : `${suggestion.monthsCounted} months`}.
              </Alert>
            )}

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.rolloverEnabled}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, rolloverEnabled: e.target.checked }))
                    }
                  />
                }
                label="Roll over unused amount to next month"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4, mt: -0.5 }}>
                If you go over, next month&apos;s effective limit shrinks by the same amount.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" }, m: 0 },
          }}
        >
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={16} color="inherit" />
                </Box>
              ) : undefined
            }
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Budget"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
