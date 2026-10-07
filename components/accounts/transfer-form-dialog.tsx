"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { DialogShell } from "@/components/shared/ui/dialog-shell";
import { DialogDatePicker } from "@/components/shared/ui/dialog-date-picker";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { formatCurrency } from "@/lib/utils/format";
import type { FinanceAccountSummary } from "@/lib/types";

type TransferFormDialogProps = {
  open: boolean;
  accounts: FinanceAccountSummary[];
  /** Pre-selects the destination and amount, e.g. paying off a credit card. */
  prefill?: { toAccountId: string; amount: number } | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function TransferFormDialog({
  open,
  accounts,
  prefill,
  onClose,
  onSuccess,
}: TransferFormDialogProps) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const to = prefill?.toAccountId ?? accounts[1]?.id ?? "";
    // Pay from the primary account (or the first other account) by default.
    const from =
      accounts.find((account) => account.isPrimary && account.id !== to)?.id ??
      accounts.find((account) => account.id !== to)?.id ??
      "";
    setFromAccountId(from);
    setToAccountId(to);
    setAmount(prefill && prefill.amount > 0 ? prefill.amount.toFixed(2) : "");
    setDate(dayjs());
    setNote("");
    setError(null);
  }, [open, accounts, prefill]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setError("Choose two different accounts.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: value,
          date: date.toISOString(),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to record transfer");
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map((account) => (
    <MenuItem key={account.id} value={account.id}>
      {account.name} · {formatCurrency(account.currentBalance)}
    </MenuItem>
  ));

  return (
    <DialogShell
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="xs"
      title="Transfer money"
      subtitle="Moves money between your accounts. Transfers aren't counted as income or spending."
    >
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ overflow: "visible" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                {...formTextFieldProps}
                select
                label="From"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
              >
                {accountOptions}
              </TextField>
              <TextField
                {...formTextFieldProps}
                select
                label="To"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                {accountOptions}
              </TextField>
              <TextField
                {...formTextFieldProps}
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                slotProps={{ ...formTextFieldProps.slotProps, htmlInput: { min: 0, step: "0.01" } }}
                required
              />
              <Box sx={formFieldSx}>
                <DialogDatePicker
                  label="Date"
                  value={date}
                  onChange={(value: Dayjs | null) => value && setDate(value)}
                  textFieldProps={{ ...formTextFieldProps, required: true }}
                />
              </Box>
              <TextField
                {...formTextFieldProps}
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                slotProps={{ ...formTextFieldProps.slotProps, htmlInput: { maxLength: 200 } }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Transfer"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
