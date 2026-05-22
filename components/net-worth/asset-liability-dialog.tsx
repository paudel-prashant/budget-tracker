"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
} from "@/lib/validation/net-worth-validation";
import type { Asset, Liability } from "@/lib/types";

type ItemKind = "asset" | "liability";

type AssetLiabilityDialogProps = {
  kind: ItemKind;
  open: boolean;
  item?: Asset | Liability | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(iso: string): string {
  return iso.slice(0, 10);
}

const initialForm = {
  name: "",
  category: "",
  value: "",
  asOfDate: todayInputValue(),
  notes: "",
};

export function AssetLiabilityDialog({
  kind,
  open,
  item,
  onClose,
  onSuccess,
}: AssetLiabilityDialogProps) {
  const isEdit = !!item;
  const categories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const apiBase = kind === "asset" ? "/api/assets" : "/api/liabilities";

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        value: String(item.value),
        asOfDate: toInputDate(item.asOfDate),
        notes: item.notes ?? "",
      });
    } else {
      setForm({ ...initialForm, asOfDate: todayInputValue(), category: categories[0] });
    }
    setError(null);
  }, [open, item, categories]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const value = Number(form.value);
    if (!form.name.trim() || !form.category || !Number.isFinite(value) || value < 0 || !form.asOfDate) {
      setError("Please fill in name, category, value, and date.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      value,
      asOfDate: form.asOfDate,
      notes: form.notes.trim() || null,
    };

    try {
      const url = isEdit ? `${apiBase}/${item!.id}` : apiBase;
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Failed to ${isEdit ? "update" : "create"} ${kind}`);
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const titleNoun = kind === "asset" ? "Asset" : "Liability";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      sx={{ "& .MuiDialog-paper": { m: { xs: 2, sm: 3 } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEdit ? `Edit ${titleNoun}` : `Add ${titleNoun}`}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              {...formTextFieldProps}
            />

            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              required
              {...formTextFieldProps}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Value"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
              required
              {...formTextFieldProps}
            />

            <TextField
              label="As of date"
              type="date"
              value={form.asOfDate}
              onChange={(e) => setForm((prev) => ({ ...prev, asOfDate: e.target.value }))}
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...formTextFieldProps}
            />

            <TextField
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={2}
              {...formTextFieldProps}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? "Saving..." : isEdit ? "Save" : `Add ${titleNoun}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
