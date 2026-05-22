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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { CategorySelectField } from "@/components/ui/category-select-field";
import { formFieldSx, formTextFieldProps } from "@/lib/form-field";
import { FORM_STACK_SPACING } from "@/lib/layout-constants";
import type { RecurrenceFrequency, TransactionType } from "@/lib/types";

type AddRecurringDialogProps = {
  open: boolean;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const initialForm = {
  title: "",
  amount: "",
  type: "EXPENSE" as TransactionType,
  category: "",
  frequency: "MONTHLY" as RecurrenceFrequency,
  startDate: dayjs(),
  endDate: null as Dayjs | null,
};

const datePickerFieldProps = {
  ...formTextFieldProps,
};

export function AddRecurringDialog({
  open,
  extraCategories = [],
  onClose,
  onSuccess,
}: AddRecurringDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...initialForm, startDate: dayjs() });
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

    try {
      const response = await fetch("/api/recurring-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount,
          type: form.type,
          category: form.category.trim(),
          frequency: form.frequency,
          startDate: form.startDate.startOf("day").toISOString(),
          endDate: form.endDate ? form.endDate.startOf("day").toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create recurring transaction");
      }

      setForm(initialForm);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create recurring transaction"
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
        <DialogTitle>Add Recurring Transaction</DialogTitle>
        <DialogContent dividers sx={{ overflow: "visible" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

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
                <DatePicker
                  label="Start date"
                  value={form.startDate}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      setForm((prev) => ({ ...prev, startDate: value }));
                    }
                  }}
                  slotProps={{ textField: { ...datePickerFieldProps, required: true } }}
                />
              </Box>

              <Box sx={formFieldSx}>
                <DatePicker
                  label="End date (optional)"
                  value={form.endDate}
                  onChange={(value: Dayjs | null) => {
                    setForm((prev) => ({ ...prev, endDate: value }));
                  }}
                  minDate={form.startDate}
                  slotProps={{ textField: datePickerFieldProps }}
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
            {submitting ? "Saving..." : "Add Recurring"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
