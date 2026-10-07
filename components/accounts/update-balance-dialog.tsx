"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
} from "@mui/material";
import { DialogShell } from "@/components/shared/ui/dialog-shell";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { formatCurrency } from "@/lib/utils/format";
import type { FinanceAccountSummary } from "@/lib/types";

type UpdateBalanceDialogProps = {
  account: FinanceAccountSummary | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

/**
 * Sets an account to its real current balance: an investment's market value, or a bank
 * statement's balance. Credit cards are entered as the amount owed.
 */
export function UpdateBalanceDialog({ account, onClose, onSuccess }: UpdateBalanceDialogProps) {
  const isCredit = account?.type === "CREDIT";
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    const current = account.type === "CREDIT" ? -account.currentBalance : account.currentBalance;
    setValue(current.toFixed(2));
    setError(null);
  }, [account]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) return;

    const entered = Number(value);
    if (!value.trim() || !Number.isFinite(entered)) {
      setError("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounts/${account.id}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: isCredit ? -entered : entered }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to update balance");
      }
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update balance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={Boolean(account)}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="xs"
      title={`Update ${account?.name ?? "balance"}`}
      subtitle={
        account?.type === "INVESTMENT"
          ? "Enter today's market value. Gains and losses adjust the balance without counting as income or spending."
          : "Match your statement. The difference adjusts the balance without creating a transaction."
      }
    >
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              {...formTextFieldProps}
              label={isCredit ? "Amount owed" : "Current balance"}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              helperText={
                account
                  ? `Currently ${formatCurrency(isCredit ? -account.currentBalance : account.currentBalance)}`
                  : undefined
              }
              slotProps={{ ...formTextFieldProps.slotProps, htmlInput: { step: "0.01" } }}
              autoFocus
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Update"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
