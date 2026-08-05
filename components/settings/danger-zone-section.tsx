"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { CARD_PADDING, FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";

const CONFIRMATION_PHRASE = "DELETE";

export function DangerZoneSection() {
  const { showSuccess, showError } = useSnackbar();

  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/account/export");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `budgetrax-export-${dayjs().format("YYYY-MM-DD")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      showSuccess("Your data export has started downloading");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setConfirmText("");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete account");
      }

      // Session cookie must be cleared immediately — the account it points to no
      // longer exists, and any further request carrying it would just fail.
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <>
      <Stack sx={{ p: CARD_PADDING }} spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="error">
            Danger zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Export everything Budgetrax has stored about you, or permanently delete your account
            and all its data.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Preparing export..." : "Export my data"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverOutlinedIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete my account
          </Button>
        </Stack>
      </Stack>

      <Dialog open={deleteOpen} onClose={closeDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            <Alert severity="error" variant="outlined">
              This permanently deletes your account and every transaction, budget, recurring
              transaction, asset, liability, and report tied to it. This cannot be undone.
              Consider exporting your data first.
            </Alert>
            <TextField
              {...formTextFieldProps}
              label={`Type "${CONFIRMATION_PHRASE}" to confirm`}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoFocus
              disabled={deleting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleting || confirmText !== CONFIRMATION_PHRASE}
          >
            {deleting ? "Deleting..." : "Permanently delete my account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
