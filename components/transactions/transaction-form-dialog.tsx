"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { CategorySelectField } from "@/components/ui/category-select-field";
import { CategorySuggestionBanner } from "@/components/transactions/category-suggestion-banner";
import { DialogShell } from "@/components/ui/dialog-shell";
import { useCategorySuggestion } from "@/hooks/use-category-suggestion";
import { formFieldSx, formTextFieldProps } from "@/lib/form-field";
import { FORM_STACK_SPACING } from "@/lib/layout-constants";
import type { Transaction, TransactionType } from "@/lib/types";

type TransactionFormDialogProps = {
  open: boolean;
  transaction?: Transaction | null;
  extraCategories?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type FormState = {
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: Dayjs;
};

const emptyForm = (): FormState => ({
  title: "",
  amount: "",
  type: "EXPENSE",
  category: "",
  date: dayjs(),
});

function formFromTransaction(transaction: Transaction): FormState {
  return {
    title: transaction.title,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: dayjs(transaction.date),
  };
}

const datePickerFieldProps = {
  ...formTextFieldProps,
  required: true,
};

export function TransactionFormDialog({
  open,
  transaction,
  extraCategories = [],
  onClose,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryTouchedRef = useRef(false);
  const applyingSuggestionRef = useRef(false);

  const { suggestion, loading: suggestionLoading } = useCategorySuggestion({
    title: form.title,
    type: form.type,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    setForm(transaction ? formFromTransaction(transaction) : emptyForm());
    setError(null);
    categoryTouchedRef.current = Boolean(transaction?.category);
  }, [open, transaction]);

  const applySuggestion = useCallback(
    (category: string) => {
      applyingSuggestionRef.current = true;
      setForm((prev) => ({ ...prev, category }));
      applyingSuggestionRef.current = false;
    },
    []
  );

  useEffect(() => {
    if (!open || isEdit || categoryTouchedRef.current || !suggestion?.category) return;
    if (form.category.trim()) return;

    applySuggestion(suggestion.category);
  }, [open, isEdit, suggestion, form.category, applySuggestion]);

  const handleClose = () => {
    if (submitting) return;
    setForm(emptyForm());
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const amount = Number(form.amount);

    if (!form.title.trim() || !form.category.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Please fill in all fields with valid values.");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category.trim(),
      date: form.date.toISOString(),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/transactions/${transaction!.id}` : "/api/transactions",
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
            (isEdit ? "Failed to update transaction" : "Failed to create transaction")
        );
      }

      setForm(emptyForm());
      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update transaction"
            : "Failed to create transaction"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      title={isEdit ? "Edit Transaction" : "Add Transaction"}
      subtitle={
        isEdit
          ? "Update the details below and save your changes."
          : "Record a new income or expense for your ledger."
      }
    >
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ overflow: "visible", borderBottom: 1, borderColor: "divider" }}>
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
                onChange={(e) => {
                  categoryTouchedRef.current = false;
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                    category: "",
                  }));
                }}
              >
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </TextField>

              <CategorySuggestionBanner
                suggestion={suggestion}
                currentCategory={form.category}
                loading={suggestionLoading}
                onApply={() => {
                  if (suggestion?.category) {
                    applySuggestion(suggestion.category);
                  }
                }}
              />

              <CategorySelectField
                value={form.category}
                onChange={(category) => {
                  if (!applyingSuggestionRef.current) {
                    categoryTouchedRef.current = true;
                  }
                  setForm((prev) => ({ ...prev, category }));
                }}
                extraCategories={extraCategories}
                transactionType={form.type}
              />

              <Box sx={formFieldSx}>
                <DatePicker
                  label="Date"
                  value={form.date}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      setForm((prev) => ({ ...prev, date: value }));
                    }
                  }}
                  slotProps={{
                    textField: datePickerFieldProps,
                  }}
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
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Transaction"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
