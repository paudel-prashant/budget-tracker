"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { DialogShell } from "@/components/shared/ui/dialog-shell";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { FinanceAccountSummary, FinanceAccountType } from "@/lib/types";

export const ACCOUNT_TYPE_LABELS: Record<FinanceAccountType, string> = {
  CHECKING: "Chequing",
  SAVINGS: "Savings",
  CASH: "Cash",
  CREDIT: "Credit card",
  INVESTMENT: "Investment (TFSA, RRSP…)",
  OTHER: "Other",
};

type AccountFormDialogProps = {
  open: boolean;
  account: FinanceAccountSummary | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function AccountFormDialog({ open, account, onClose, onSuccess }: AccountFormDialogProps) {
  const isEdit = Boolean(account);
  const [name, setName] = useState("");
  const [type, setType] = useState<FinanceAccountType>("CHECKING");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "CHECKING");
    setOpeningBalance(String(account?.openingBalance ?? 0));
    setCreditLimit(account?.creditLimit ? String(account.creditLimit) : "");
    setError(null);
  }, [open, account]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const balance = Number(openingBalance || 0);
    const limit = creditLimit.trim() ? Number(creditLimit) : null;

    if (!name.trim() || !Number.isFinite(balance)) {
      setError("Enter a name and a valid opening balance.");
      return;
    }
    if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
      setError("The credit limit must be a positive number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(isEdit ? `/api/accounts/${account!.id}` : "/api/accounts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          openingBalance: balance,
          creditLimit: type === "CREDIT" ? limit : null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save account");
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="xs"
      title={isEdit ? "Edit account" : "Add account"}
      subtitle="Balances are calculated from the opening balance plus this account's transactions and transfers."
    >
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              {...formTextFieldProps}
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <TextField
              {...formTextFieldProps}
              select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as FinanceAccountType)}
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              {...formTextFieldProps}
              label="Opening balance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              helperText={
                type === "CREDIT"
                  ? "Enter money owed as a negative number."
                  : type === "INVESTMENT"
                    ? "Current value. Use “Update balance” later as the market moves."
                    : "The balance before any transaction recorded here."
              }
              slotProps={{ ...formTextFieldProps.slotProps, htmlInput: { step: "0.01" } }}
            />
            {type === "CREDIT" && (
              <TextField
                {...formTextFieldProps}
                label="Credit limit (optional)"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                helperText="The maximum your card provider allows — used to show utilization."
                slotProps={{ ...formTextFieldProps.slotProps, htmlInput: { min: 0, step: "0.01" } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add account"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
