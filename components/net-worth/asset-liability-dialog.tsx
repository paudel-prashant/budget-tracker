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
  Typography,
} from "@mui/material";
import { formTextFieldProps } from "@/lib/theme/form-field";
import { FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
} from "@/lib/domain/net-worth-categories";
import {
  GOLD_PURITIES,
  GOLD_WEIGHT_UNITS,
  goldHoldingValue,
  isGoldCategory,
  toGrams,
  type GoldWeightUnit,
} from "@/lib/domain/gold";
import { useGoldPrice } from "@/hooks/use-gold-price";
import { formatCurrency } from "@/lib/utils/format";
import type { Asset, Liability } from "@/lib/types";

type ItemKind = "asset" | "liability";

type AssetLiabilityDialogProps = {
  kind: ItemKind;
  open: boolean;
  item?: Asset | Liability | null;
  /** Category preselected when adding (e.g. "Gold" from the gold price card). */
  initialCategory?: string;
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
  goldWeight: "",
  goldUnit: "g" as GoldWeightUnit,
  goldPurity: String(GOLD_PURITIES[1].value),
  costBasis: "",
};

export function AssetLiabilityDialog({
  kind,
  open,
  item,
  initialCategory,
  onClose,
  onSuccess,
}: AssetLiabilityDialogProps) {
  const isEdit = !!item;
  const categories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const apiBase = kind === "asset" ? "/api/assets" : "/api/liabilities";

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGold = kind === "asset" && isGoldCategory(form.category);
  const { quote } = useGoldPrice(open && isGold);
  const goldGrams = toGrams(Number(form.goldWeight) || 0, form.goldUnit);
  const goldPurity = Number(form.goldPurity) || 0;
  const goldValue =
    quote && goldGrams > 0 ? goldHoldingValue(goldGrams, goldPurity, quote.pricePerOunce) : null;

  useEffect(() => {
    if (!open) return;

    if (item) {
      const asset = kind === "asset" ? (item as Asset) : null;
      setForm({
        name: item.name,
        category: item.category,
        value: String(item.value),
        asOfDate: toInputDate(item.asOfDate),
        notes: item.notes ?? "",
        goldWeight: asset?.goldGrams != null ? String(asset.goldGrams) : "",
        goldUnit: "g",
        goldPurity: String(asset?.goldPurity ?? GOLD_PURITIES[1].value),
        costBasis: asset?.costBasis != null ? String(asset.costBasis) : "",
      });
    } else {
      setForm({
        ...initialForm,
        asOfDate: todayInputValue(),
        category: initialCategory ?? categories[0],
      });
    }
    setError(null);
  }, [open, item, kind, categories, initialCategory]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    // Gold is valued from weight x purity x live price; the server re-prices it on save.
    const value = isGold ? (goldValue ?? (Number(form.value) || 0)) : Number(form.value);
    if (!form.name.trim() || !form.category || !Number.isFinite(value) || value < 0 || !form.asOfDate) {
      setError("Please fill in name, category, value, and date.");
      setSubmitting(false);
      return;
    }
    if (isGold && !(goldGrams > 0)) {
      setError("Enter how much gold you hold.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      value,
      asOfDate: form.asOfDate,
      notes: form.notes.trim() || null,
      ...(isGold
        ? {
            goldGrams,
            goldPurity,
            costBasis: form.costBasis.trim() === "" ? null : Number(form.costBasis),
          }
        : {}),
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

            {isGold ? (
              <>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    label="Weight"
                    type="number"
                    inputProps={{ min: 0, step: "any" }}
                    value={form.goldWeight}
                    onChange={(e) => setForm((prev) => ({ ...prev, goldWeight: e.target.value }))}
                    required
                    {...formTextFieldProps}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    select
                    label="Unit"
                    value={form.goldUnit}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, goldUnit: e.target.value as GoldWeightUnit }))
                    }
                    {...formTextFieldProps}
                    sx={{ width: 150, flexShrink: 0 }}
                  >
                    {GOLD_WEIGHT_UNITS.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  select
                  label="Purity"
                  value={form.goldPurity}
                  onChange={(e) => setForm((prev) => ({ ...prev, goldPurity: e.target.value }))}
                  {...formTextFieldProps}
                >
                  {GOLD_PURITIES.map((purity) => (
                    <MenuItem key={purity.value} value={String(purity.value)}>
                      {purity.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Total purchase cost (optional)"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.costBasis}
                  onChange={(e) => setForm((prev) => ({ ...prev, costBasis: e.target.value }))}
                  helperText="Used to show your gain or loss. Include any premium you paid."
                  {...formTextFieldProps}
                />

                <Alert severity="info" variant="outlined" icon={false}>
                  <Typography variant="body2">
                    {goldValue !== null ? (
                      <>
                        Current value:{" "}
                        <strong>{formatCurrency(goldValue, quote?.currency)}</strong>
                      </>
                    ) : quote ? (
                      "Enter a weight to see the current value."
                    ) : (
                      "Fetching the live gold price…"
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updates automatically with the live gold price.
                  </Typography>
                </Alert>
              </>
            ) : (
              <TextField
                label="Value"
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                required
                {...formTextFieldProps}
              />
            )}

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
