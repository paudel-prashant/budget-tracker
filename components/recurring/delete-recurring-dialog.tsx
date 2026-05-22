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
import { formatCurrency } from "@/lib/utils/format";
import type { RecurringTransaction } from "@/lib/types";

type DeleteRecurringDialogProps = {
  recurring: RecurringTransaction | null;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteRecurringDialog({
  recurring,
  open,
  deleting,
  onClose,
  onConfirm,
}: DeleteRecurringDialogProps) {
  if (!recurring) return null;

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete recurring transaction?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Stop future auto-generated entries for <strong>{recurring.title}</strong> (
          {formatCurrency(recurring.amount)}). Existing generated transactions will be kept.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
