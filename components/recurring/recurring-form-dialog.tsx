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
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DialogDatePicker } from "@/components/shared/ui/dialog-date-picker";
import dayjs, { type Dayjs } from "dayjs";
import { CategorySelectField } from "@/components/shared/ui/category-select-field";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { RecurrenceFrequency, RecurringTransaction, TransactionType } from "@/lib/types";

type RecurringFormDialogProps = {
  open: boolean;
  recurring?: RecurringTransaction | null;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type FormState = {
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: Dayjs;
  endDate: Dayjs | null;
};

const emptyForm = (): FormState => ({
  title: "",
  amount: "",
  type: "EXPENSE",
  category: "",
  frequency: "MONTHLY",
  startDate: dayjs(),
  endDate: null,
});

function formFromRecurring(recurring: RecurringTransaction): FormState {
  return {
    title: recurring.title,
    amount: String(recurring.amount),
    type: recurring.type,
    category: recurring.category,
    frequency: recurring.frequency,
    startDate: dayjs(recurring.startDate),
    endDate: recurring.endDate ? dayjs(recurring.endDate) : null,
  };
}

const datePickerFieldProps = {
  ...formTextFieldProps,
};

export function RecurringFormDialog({
  open,
  recurring,
  extraCategories = [],
  onClose,
  onSuccess,
}: RecurringFormDialogProps) {
  const isEdit = Boolean(recurring);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(recurring ? formFromRecurring(recurring) : emptyForm());
    setError(null);
  }, [open, recurring]);

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Please fill in all required fields with valid values.");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category.trim(),
      frequency: form.frequency,
      startDate: form.startDate.startOf("day").toISOString(),
      endDate: form.endDate ? form.endDate.startOf("day").toISOString() : null,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/recurring-transactions/${recurring!.id}` : "/api/recurring-transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            (isEdit ? "Failed to update recurring transaction" : "Failed to create recurring transaction")
        );
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update recurring transaction"
            : "Failed to create recurring transaction"
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
        <DialogTitle>{isEdit ? "Edit Recurring Transaction" : "Add Recurring Transaction"}</DialogTitle>
        <DialogContent dividers sx={{ overflow: "visible" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {isEdit && (
                <Alert severity="info" variant="outlined">
                  Changes only apply going forward — transactions already generated from this
                  keep the amount they were created with.
                </Alert>
              )}

              <TextField
                {...formTextFieldProps}
                label="Title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />

              <TextField
                {...formTextFieldProps}
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                slotProps={{
                  ...formTextFieldProps.slotProps,
                  htmlInput: { min: 0, step: "0.01" },
                }}
                required
              />

              <TextField
                {...formTextFieldProps}
                select
                label="Type"
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
              >
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </TextField>

              <CategorySelectField
                value={form.category}
                onChange={(category) => setForm((prev) => ({ ...prev, category }))}
                extraCategories={extraCategories}
                transactionType={form.type}
              />

              <TextField
                {...formTextFieldProps}
                select
                label="Frequency"
                value={form.frequency}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    frequency: e.target.value as RecurrenceFrequency,
                  }))
                }
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </TextField>

              <Box sx={formFieldSx}>
                <DialogDatePicker
                  label="Start date"
                  value={form.startDate}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      setForm((prev) => ({ ...prev, startDate: value }));
                    }
                  }}
                  textFieldProps={{ ...datePickerFieldProps, required: true }}
                />
              </Box>

              <Box sx={formFieldSx}>
                <DialogDatePicker
                  label="End date (optional)"
                  value={form.endDate}
                  onChange={(value: Dayjs | null) => {
                    setForm((prev) => ({ ...prev, endDate: value }));
                  }}
                  minDate={form.startDate}
                  textFieldProps={datePickerFieldProps}
                />
              </Box>
            </Stack>
          </LocalizationProvider>
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
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Recurring"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
