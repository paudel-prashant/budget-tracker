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
import { CategorySelectField } from "@/components/shared/ui/category-select-field";
import { TagInput } from "@/components/shared/ui/tag-input";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import type { CategoryRuleMatchType } from "@/lib/domain/category-rules";
import type { TransactionType } from "@/lib/types";

export type CategoryRuleDraft = {
  id?: string;
  pattern: string;
  matchType: CategoryRuleMatchType;
  type: TransactionType | null;
  category: string;
  tags: string[];
};

export const MATCH_TYPE_LABELS: Record<CategoryRuleMatchType, string> = {
  CONTAINS: "contains",
  STARTS_WITH: "starts with",
  EXACT: "is exactly",
};

type CategoryRuleDialogProps = {
  open: boolean;
  initial: CategoryRuleDraft | null;
  onClose: () => void;
  onSaved: (isNew: boolean) => void | Promise<void>;
};

const emptyDraft = (): CategoryRuleDraft => ({
  pattern: "",
  matchType: "CONTAINS",
  type: "EXPENSE",
  category: "",
  tags: [],
});

export function CategoryRuleDialog({ open, initial, onClose, onSaved }: CategoryRuleDialogProps) {
  const [draft, setDraft] = useState<CategoryRuleDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ?? emptyDraft());
    setError(null);
  }, [open, initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.pattern.trim() || !draft.category.trim()) {
      setError("Enter the text to match and a category.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(isEdit ? `/api/category-rules/${initial!.id}` : "/api/category-rules", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern: draft.pattern,
          matchType: draft.matchType,
          type: draft.type,
          category: draft.category.trim(),
          tags: draft.tags,
        }),
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Failed to save rule");
      }

      await onSaved(!isEdit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="sm"
      title={isEdit ? "Edit category rule" : "New category rule"}
      subtitle="Applied to new transactions and imports. Matching ignores case and punctuation."
    >
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                {...formTextFieldProps}
                select
                label="When the title"
                value={draft.matchType}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, matchType: e.target.value as CategoryRuleMatchType }))
                }
                sx={{ minWidth: { sm: 160 } }}
              >
                {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                {...formTextFieldProps}
                label="Text"
                placeholder="e.g. uber"
                value={draft.pattern}
                onChange={(e) => setDraft((prev) => ({ ...prev, pattern: e.target.value }))}
                required
                autoFocus
                fullWidth
              />
            </Stack>

            <TextField
              {...formTextFieldProps}
              select
              label="Applies to"
              value={draft.type ?? "ANY"}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  type: e.target.value === "ANY" ? null : (e.target.value as TransactionType),
                }))
              }
            >
              <MenuItem value="EXPENSE">Expenses</MenuItem>
              <MenuItem value="INCOME">Income</MenuItem>
              <MenuItem value="ANY">Income and expenses</MenuItem>
            </TextField>

            <CategorySelectField
              value={draft.category}
              onChange={(category) => setDraft((prev) => ({ ...prev, category }))}
              transactionType={draft.type ?? undefined}
            />

            <TagInput
              value={draft.tags}
              onChange={(tags) => setDraft((prev) => ({ ...prev, tags }))}
              options={[]}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save rule" : "Create rule"}
          </Button>
        </DialogActions>
      </form>
    </DialogShell>
  );
}
