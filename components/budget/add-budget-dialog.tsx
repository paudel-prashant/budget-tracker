"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { CategorySelectField } from "@/components/shared/ui/category-select-field";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { getCurrentMonthYear } from "@/lib/domain/budget-calculations";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";

type AddBudgetDialogProps = {
  open: boolean;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const { month, year } = getCurrentMonthYear();

const initialForm = {
  category: "",
  monthlyLimit: "",
};

export function AddBudgetDialog({
  open,
  extraCategories = [],
  onClose,
  onSuccess,
}: AddBudgetDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    setForm(initialForm);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const monthlyLimit = Number(form.monthlyLimit);

    if (!form.category.trim() || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      setError("Please enter a category and a positive monthly limit.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category.trim(),
          monthlyLimit,
          month,
          year,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create budget");
      }

      setForm(initialForm);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
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
        <DialogTitle>Add Category Budget</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <CategorySelectField
              value={form.category}
              onChange={(category) => setForm((prev) => ({ ...prev, category }))}
              extraCategories={extraCategories}
              transactionType="EXPENSE"
            />

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
            {submitting ? "Saving..." : "Add Budget"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
