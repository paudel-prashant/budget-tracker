"use client";

import { useEffect, useState } from "react";
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
import { getCurrentMonthYear } from "@/lib/domain/budget-calculations";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetFormDialogProps = {
  open: boolean;
  budget?: BudgetWithProgress | null;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const { month, year } = getCurrentMonthYear();

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
  extraCategories = [],
  onClose,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEdit = Boolean(budget);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(budget ? formFromBudget(budget) : emptyForm());
    setError(null);
  }, [open, budget]);

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
        <DialogTitle>{isEdit ? "Edit Budget" : "Add Category Budget"}</DialogTitle>
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
                onChange={(category) => setForm((prev) => ({ ...prev, category }))}
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
