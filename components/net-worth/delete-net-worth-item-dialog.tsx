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
import type { Asset, Liability } from "@/lib/types";

type DeleteNetWorthItemDialogProps = {
  kind: "asset" | "liability";
  item: Asset | Liability | null;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteNetWorthItemDialog({
  kind,
  item,
  open,
  deleting,
  onClose,
  onConfirm,
}: DeleteNetWorthItemDialogProps) {
  if (!item) return null;

  const label = kind === "asset" ? "asset" : "liability";

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete {label}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Remove <strong>{item.name}</strong> ({formatCurrency(item.value)})? This cannot be
          undone.
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
