"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import type { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

type DeleteTransactionDialogProps = {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteTransactionDialog({
  transaction,
  open,
  onClose,
  onConfirm,
}: DeleteTransactionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
    >
      <DialogTitle>Delete transaction?</DialogTitle>
      <DialogContent dividers sx={{ overflow: "visible" }}>
        <DialogContentText component="div" sx={{ py: 0.5 }}>
          {transaction ? (
            <>
              Are you sure you want to delete <strong>{transaction.title}</strong> (
              {formatCurrency(transaction.amount)})? You can undo for a few seconds after deleting.
            </>
          ) : (
            "Are you sure you want to delete this transaction? You can undo for a few seconds after deleting."
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
