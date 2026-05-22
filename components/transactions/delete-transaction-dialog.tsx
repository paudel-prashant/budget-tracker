"use client";

import {
  Button,
  CircularProgress,
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
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteTransactionDialog({
  transaction,
  open,
  deleting,
  onClose,
  onConfirm,
}: DeleteTransactionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
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
              {formatCurrency(transaction.amount)})? This action cannot be undone.
            </>
          ) : (
            "Are you sure you want to delete this transaction? This action cannot be undone."
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
