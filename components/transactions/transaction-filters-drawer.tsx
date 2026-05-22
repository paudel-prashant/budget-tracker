"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import type { TransactionFilters, TransactionType } from "@/lib/types";

type DraftFilters = {
  category: string;
  type: "" | TransactionType;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  minAmount: string;
  maxAmount: string;
};

const emptyDraft = (): DraftFilters => ({
  category: "",
  type: "",
  dateFrom: null,
  dateTo: null,
  minAmount: "",
  maxAmount: "",
});

function draftFromFilters(filters: TransactionFilters): DraftFilters {
  return {
    category: filters.category ?? "",
    type: filters.type ?? "",
    dateFrom: filters.dateFrom ? dayjs(filters.dateFrom) : null,
    dateTo: filters.dateTo ? dayjs(filters.dateTo) : null,
    minAmount: filters.minAmount !== undefined ? String(filters.minAmount) : "",
    maxAmount: filters.maxAmount !== undefined ? String(filters.maxAmount) : "",
  };
}

function filtersFromDraft(draft: DraftFilters): TransactionFilters {
  const min = draft.minAmount.trim() ? Number.parseFloat(draft.minAmount) : undefined;
  const max = draft.maxAmount.trim() ? Number.parseFloat(draft.maxAmount) : undefined;

  return {
    category: draft.category.trim() || undefined,
    type: draft.type || undefined,
    dateFrom: draft.dateFrom?.startOf("day").toISOString(),
    dateTo: draft.dateTo?.endOf("day").toISOString(),
    minAmount: min !== undefined && Number.isFinite(min) ? min : undefined,
    maxAmount: max !== undefined && Number.isFinite(max) ? max : undefined,
  };
}

type TransactionFiltersDrawerProps = {
  open: boolean;
  filters: TransactionFilters;
  categories: string[];
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
};

export function TransactionFiltersDrawer({
  open,
  filters,
  categories,
  onClose,
  onApply,
}: TransactionFiltersDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [draft, setDraft] = useState<DraftFilters>(emptyDraft);

  useEffect(() => {
    if (open) {
      setDraft(draftFromFilters(filters));
    }
  }, [open, filters]);

  const handleApply = () => {
    onApply(filtersFromDraft(draft));
    onClose();
  };

  const handleReset = () => {
    setDraft(emptyDraft());
  };

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 360 },
            maxHeight: { xs: "90vh", sm: "100%" },
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 },
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose} aria-label="Close filters">
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={2.5} sx={{ p: 2.5, overflowY: "auto" }}>
          <FormControl fullWidth sx={formFieldSx}>
            <InputLabel id="filter-category-label" shrink>
              Category
            </InputLabel>
            <Select
              labelId="filter-category-label"
              label="Category"
              value={draft.category}
              displayEmpty
              notched
              onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
            >
              <MenuItem value="">
                <em>All categories</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={formFieldSx}>
            <InputLabel id="filter-type-label" shrink>
              Type
            </InputLabel>
            <Select
              labelId="filter-type-label"
              label="Type"
              value={draft.type}
              notched
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  type: e.target.value as DraftFilters["type"],
                }))
              }
            >
              <MenuItem value="">All types</MenuItem>
              <MenuItem value="INCOME">Income</MenuItem>
              <MenuItem value="EXPENSE">Expense</MenuItem>
            </Select>
          </FormControl>

          <Box sx={formFieldSx}>
            <DatePicker
              label="From date"
              value={draft.dateFrom}
              onChange={(value) => setDraft((prev) => ({ ...prev, dateFrom: value }))}
              slotProps={{ textField: formTextFieldProps }}
            />
          </Box>

          <Box sx={formFieldSx}>
            <DatePicker
              label="To date"
              value={draft.dateTo}
              minDate={draft.dateFrom ?? undefined}
              onChange={(value) => setDraft((prev) => ({ ...prev, dateTo: value }))}
              slotProps={{ textField: formTextFieldProps }}
            />
          </Box>

          <TextField
            {...formTextFieldProps}
            label="Minimum amount"
            type="number"
            value={draft.minAmount}
            onChange={(e) => setDraft((prev) => ({ ...prev, minAmount: e.target.value }))}
            slotProps={{
              ...formTextFieldProps.slotProps,
              htmlInput: { min: 0, step: "0.01" },
            }}
          />

          <TextField
            {...formTextFieldProps}
            label="Maximum amount"
            type="number"
            value={draft.maxAmount}
            onChange={(e) => setDraft((prev) => ({ ...prev, maxAmount: e.target.value }))}
            slotProps={{
              ...formTextFieldProps.slotProps,
              htmlInput: { min: 0, step: "0.01" },
            }}
          />
        </Stack>
      </LocalizationProvider>

      <Divider />
      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={1.5}
        sx={{ p: 2.5 }}
      >
        <Button variant="outlined" onClick={handleReset} fullWidth={isMobile}>
          Reset
        </Button>
        <Button variant="contained" onClick={handleApply} fullWidth={isMobile}>
          Apply filters
        </Button>
      </Stack>
    </Drawer>
  );
}
