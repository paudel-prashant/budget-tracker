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
import { ACCOUNT_TYPE_LABELS } from "@/components/accounts/account-form-dialog";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { suggestAccountTypeForNetWorthItem } from "@/lib/domain/account-net-worth";
import { formatCurrency } from "@/lib/utils/format";
import type { Asset, FinanceAccountType, Liability } from "@/lib/types";

export type MoveTarget = { kind: "asset" | "liability"; item: Asset | Liability };

type MoveToAccountDialogProps = {
  target: MoveTarget | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const ASSET_ACCOUNT_TYPES: FinanceAccountType[] = ["SAVINGS", "CHECKING", "CASH", "INVESTMENT", "OTHER"];

/**
 * Replaces a manual net-worth item with an account on the Accounts page, so its balance
 * follows transactions and transfers and it's counted once, from one place.
 */
export function MoveToAccountDialog({ target, onClose, onSuccess }: MoveToAccountDialogProps) {
  const [type, setType] = useState<FinanceAccountType>("SAVINGS");
  const [creditLimit, setCreditLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setType(
      suggestAccountTypeForNetWorthItem(target.kind, target.item.category) ??
        (target.kind === "asset" ? "SAVINGS" : "CREDIT")
    );
    setCreditLimit("");
    setError(null);
  }, [target]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target) return;

    const limit = creditLimit.trim() ? Number(creditLimit) : null;
    if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
      setError("The credit limit must be a positive number.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/net-worth/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: target.kind, id: target.item.id, type, creditLimit: limit }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to move to Accounts");
      }
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move to Accounts");
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: FinanceAccountType[] = target?.kind === "liability" ? ["CREDIT"] : ASSET_ACCOUNT_TYPES;

  return (
    <DialogShell
      open={Boolean(target)}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="xs"
      title={`Move “${target?.item.name ?? ""}” to Accounts`}
      subtitle="It becomes an account whose balance follows your transactions and transfers, and still counts toward net worth — once."
    >
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {target && (
              <Alert severity="info" variant="outlined">
                Starts at {target.kind === "liability" ? "owing " : ""}
                {formatCurrency(target.item.value)}. The manual {target.kind} is removed.
              </Alert>
            )}
            <TextField
              {...formTextFieldProps}
              select
              label="Account type"
              value={type}
              onChange={(e) => setType(e.target.value as FinanceAccountType)}
            >
              {typeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {ACCOUNT_TYPE_LABELS[option]}
                </MenuItem>
              ))}
            </TextField>
            {type === "CREDIT" && (
              <TextField
                {...formTextFieldProps}
                label="Credit limit (optional)"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
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
            {submitting ? "Moving..." : "Move to Accounts"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
