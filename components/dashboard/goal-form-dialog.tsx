"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DialogDatePicker } from "@/components/shared/ui/dialog-date-picker";
import dayjs, { type Dayjs } from "dayjs";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { Goal } from "@/lib/types";

type GoalFormDialogProps = {
  open: boolean;
  goal?: Goal | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type FormState = {
  name: string;
  category: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Dayjs | null;
};

const emptyForm = (): FormState => ({
  name: "",
  category: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: null,
});

function formFromGoal(goal: Goal): FormState {
  return {
    name: goal.name,
    category: goal.category ?? "",
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount),
    targetDate: goal.targetDate ? dayjs(goal.targetDate) : null,
  };
}

export function GoalFormDialog({ open, goal, onClose, onSuccess }: GoalFormDialogProps) {
  const isEdit = Boolean(goal);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(goal ? formFromGoal(goal) : emptyForm());
    setError(null);
  }, [open, goal]);

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const targetAmount = Number(form.targetAmount);
    const currentAmount = form.currentAmount.trim() ? Number(form.currentAmount) : 0;

    if (
      !form.name.trim() ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      setError("Please enter a name and a positive target amount.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      targetAmount,
      currentAmount,
      targetDate: form.targetDate ? form.targetDate.startOf("day").toISOString() : null,
    };

    try {
      const response = await fetch(isEdit ? `/api/goals/${goal!.id}` : "/api/goals", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? (isEdit ? "Failed to update goal" : "Failed to create goal"));
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? "Failed to update goal" : "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

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
        <DialogTitle>{isEdit ? "Edit Goal" : "Add Savings Goal"}</DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                {...formTextFieldProps}
                label="Goal name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Emergency fund, Trip to Japan"
                required
              />

              <TextField
                {...formTextFieldProps}
                label="Category (optional)"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              />

              <TextField
                {...formTextFieldProps}
                label="Target amount"
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                slotProps={{
                  ...formTextFieldProps.slotProps,
                  htmlInput: { min: 0, step: "0.01" },
                }}
                required
              />

              <TextField
                {...formTextFieldProps}
                label="Current amount saved"
                type="number"
                value={form.currentAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
                slotProps={{
                  ...formTextFieldProps.slotProps,
                  htmlInput: { min: 0, step: "0.01" },
                }}
              />

              <Box sx={formFieldSx}>
                <DialogDatePicker
                  label="Target date (optional)"
                  value={form.targetDate}
                  onChange={(value: Dayjs | null) => setForm((prev) => ({ ...prev, targetDate: value }))}
                  textFieldProps={formTextFieldProps}
                />
              </Box>
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" }, m: 0 },
          }}
        >
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={16} color="inherit" />
                </Box>
              ) : undefined
            }
          >
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Goal"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
