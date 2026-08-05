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
import type { Goal } from "@/lib/types";

type DeleteGoalDialogProps = {
  goal: Goal | null;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteGoalDialog({ goal, open, deleting, onClose, onConfirm }: DeleteGoalDialogProps) {
  if (!goal) return null;

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete goal?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Remove <strong>{goal.name}</strong>? This cannot be undone.
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
