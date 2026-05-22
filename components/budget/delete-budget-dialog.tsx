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
import { formatCurrency, formatMonthYear } from "@/lib/utils/format";
import type { BudgetWithProgress } from "@/lib/types";

type DeleteBudgetDialogProps = {
  budget: BudgetWithProgress | null;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteBudgetDialog({
  budget,
  open,
  deleting,
  onClose,
  onConfirm,
}: DeleteBudgetDialogProps) {
  if (!budget) return null;

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete budget?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Remove the {formatMonthYear(budget.month, budget.year)} budget for{" "}
          <strong>{budget.category}</strong> ({formatCurrency(budget.monthlyLimit)} limit)? This
          cannot be undone.
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
