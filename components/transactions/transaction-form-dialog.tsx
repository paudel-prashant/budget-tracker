"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DialogDatePicker } from "@/components/shared/ui/dialog-date-picker";
import dayjs, { type Dayjs } from "dayjs";
import { CategorySelectField } from "@/components/shared/ui/category-select-field";
import { CategorySuggestionBanner } from "@/components/transactions/category-suggestion-banner";
import { DialogShell } from "@/components/shared/ui/dialog-shell";
import { TagInput } from "@/components/shared/ui/tag-input";
import { useCategorySuggestion } from "@/hooks/use-category-suggestion";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { formatCurrency } from "@/lib/utils/format";
import { mergeTags } from "@/lib/domain/category-rules";
import type { FinanceAccountSummary, Transaction, TransactionType } from "@/lib/types";

type TransactionFormDialogProps = {
  open: boolean;
  transaction?: Transaction | null;
  extraCategories?: string[];
  knownTags?: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type FormState = {
  title: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: Dayjs;
  tags: string[];
  /** "" → the primary account. */
  financeAccountId: string;
  splitEnabled: boolean;
  splits: SplitRow[];
};

type SplitRow = { category: string; amount: string };

const emptySplits = (): SplitRow[] => [
  { category: "", amount: "" },
  { category: "", amount: "" },
];

const MAX_SPLITS = 10;

const emptyForm = (): FormState => ({
  title: "",
  amount: "",
  type: "EXPENSE",
  category: "",
  date: dayjs(),
  tags: [],
  financeAccountId: "",
  splitEnabled: false,
  splits: emptySplits(),
});

function toCents(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function formFromTransaction(transaction: Transaction): FormState {
  return {
    title: transaction.title,
    amount: String(transaction.baseAmount ?? transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: dayjs(transaction.date),
    tags: transaction.tags ?? [],
    financeAccountId: transaction.financeAccountId ?? "",
    splitEnabled: false,
    splits: emptySplits(),
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
  knownTags = [],
  onClose,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<FinanceAccountSummary[]>([]);
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

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // The account picker is optional UI — if this fails the transaction still saves
    // to the primary account.
    fetch("/api/accounts")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { accounts: FinanceAccountSummary[] } | null) => {
        if (!cancelled && data) setAccounts(data.accounts);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [open]);

  const splitRemainingCents =
    toCents(form.amount) - form.splits.reduce((sum, split) => sum + toCents(split.amount), 0);

  const updateSplit = (index: number, patch: Partial<SplitRow>) => {
    setForm((prev) => ({
      ...prev,
      splits: prev.splits.map((split, i) => (i === index ? { ...split, ...patch } : split)),
    }));
  };

  const applySuggestion = useCallback(
    (category: string, tags: string[] = []) => {
      applyingSuggestionRef.current = true;
      // A matching category rule can also add tags (e.g. "uber" -> Transportation, #work).
      setForm((prev) => ({ ...prev, category, tags: mergeTags(prev.tags, tags) }));
      applyingSuggestionRef.current = false;
    },
    []
  );

  useEffect(() => {
    if (!open || isEdit || categoryTouchedRef.current || !suggestion?.category) return;
    if (form.category.trim()) return;

    applySuggestion(suggestion.category, suggestion.tags);
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
    const splitting = !isEdit && form.splitEnabled;
    const splits = form.splits.map((split) => ({
      category: split.category.trim(),
      amount: Number(split.amount),
    }));
    const category = splitting ? (splits[0]?.category ?? "") : form.category.trim();

    if (!form.title.trim() || !category || !Number.isFinite(amount) || amount <= 0) {
      setError("Please fill in all fields with valid values.");
      setSubmitting(false);
      return;
    }

    if (splitting) {
      if (splits.some((split) => !split.category || !(split.amount > 0))) {
        setError("Each split needs a category and a positive amount.");
        setSubmitting(false);
        return;
      }
      if (splitRemainingCents !== 0) {
        setError("Split amounts must add up to the total amount.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      amount,
      type: form.type,
      category,
      date: form.date.toISOString(),
      tags: form.tags,
      ...(form.financeAccountId ? { financeAccountId: form.financeAccountId } : {}),
      ...(splitting ? { splits } : {}),
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

              {!isEdit && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.splitEnabled}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          splitEnabled: e.target.checked,
                          // Seed the first part with whatever was already chosen.
                          splits: e.target.checked
                            ? [{ category: prev.category, amount: prev.amount }, { category: "", amount: "" }]
                            : prev.splits,
                        }))
                      }
                    />
                  }
                  label="Split across categories"
                />
              )}

              {!isEdit && form.splitEnabled ? (
                <Stack spacing={1.5}>
                  {form.splits.map((split, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <CategorySelectField
                          value={split.category}
                          onChange={(category) => updateSplit(index, { category })}
                          extraCategories={extraCategories}
                          transactionType={form.type}
                        />
                      </Box>
                      <TextField
                        {...formTextFieldProps}
                        label="Amount"
                        type="number"
                        value={split.amount}
                        onChange={(e) => updateSplit(index, { amount: e.target.value })}
                        slotProps={{
                          ...formTextFieldProps.slotProps,
                          htmlInput: { min: 0, step: "0.01" },
                        }}
                        sx={{ width: 130, flexShrink: 0 }}
                      />
                      <Tooltip title="Remove part">
                        <span>
                          <IconButton
                            aria-label="Remove split part"
                            disabled={form.splits.length <= 2}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                splits: prev.splits.filter((_, i) => i !== index),
                              }))
                            }
                            sx={{ mt: 1 }}
                          >
                            <CloseOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button
                      size="small"
                      startIcon={<AddOutlinedIcon />}
                      disabled={form.splits.length >= MAX_SPLITS}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          splits: [
                            ...prev.splits,
                            {
                              category: "",
                              // Pre-fill the new part with whatever is left to allocate.
                              amount: splitRemainingCents > 0 ? (splitRemainingCents / 100).toFixed(2) : "",
                            },
                          ],
                        }))
                      }
                    >
                      Add part
                    </Button>
                    <Typography
                      variant="body2"
                      color={splitRemainingCents === 0 ? "success.main" : "warning.main"}
                    >
                      {splitRemainingCents === 0
                        ? "Fully allocated"
                        : splitRemainingCents > 0
                          ? `${formatCurrency(splitRemainingCents / 100)} left to allocate`
                          : `${formatCurrency(-splitRemainingCents / 100)} over the total`}
                    </Typography>
                  </Stack>
                </Stack>
              ) : (
                <>
                  <CategorySuggestionBanner
                    suggestion={suggestion}
                    currentCategory={form.category}
                    loading={suggestionLoading}
                    onApply={() => {
                      if (suggestion?.category) {
                        applySuggestion(suggestion.category, suggestion.tags);
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
                </>
              )}

              {accounts.length > 1 && (
                <TextField
                  {...formTextFieldProps}
                  select
                  label="Account"
                  value={form.financeAccountId || accounts.find((a) => a.isPrimary)?.id || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, financeAccountId: e.target.value }))}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Box sx={formFieldSx}>
                <DialogDatePicker
                  label="Date"
                  value={form.date}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      setForm((prev) => ({ ...prev, date: value }));
                    }
                  }}
                  textFieldProps={datePickerFieldProps}
                />
              </Box>

              <TagInput
                value={form.tags}
                onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                options={knownTags}
              />
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
