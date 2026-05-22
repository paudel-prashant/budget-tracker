"use client";

import type { ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { countActiveFilters } from "@/lib/domain/transaction-filters";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { TransactionFilters } from "@/lib/types";

type TransactionFiltersToolbarProps = {
  search: string;
  filters: TransactionFilters;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  onRemoveFilter: (key: keyof TransactionFilters) => void;
};

function buildFilterChips(
  filters: TransactionFilters,
  onRemove: (key: keyof TransactionFilters) => void
) {
  const chips: ReactNode[] = [];

  if (filters.category) {
    chips.push(
      <Chip
        key="category"
        label={`Category: ${filters.category}`}
        size="small"
        onDelete={() => onRemove("category")}
      />
    );
  }

  if (filters.type) {
    chips.push(
      <Chip
        key="type"
        label={`Type: ${filters.type === "INCOME" ? "Income" : "Expense"}`}
        size="small"
        onDelete={() => onRemove("type")}
      />
    );
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? formatDate(filters.dateFrom) : "…";
    const to = filters.dateTo ? formatDate(filters.dateTo) : "…";
    chips.push(
      <Chip
        key="date"
        label={`Date: ${from} – ${to}`}
        size="small"
        onDelete={() => {
          onRemove("dateFrom");
          onRemove("dateTo");
        }}
      />
    );
  }

  if (filters.minAmount !== undefined) {
    chips.push(
      <Chip
        key="min"
        label={`Min: ${formatCurrency(filters.minAmount)}`}
        size="small"
        onDelete={() => onRemove("minAmount")}
      />
    );
  }

  if (filters.maxAmount !== undefined) {
    chips.push(
      <Chip
        key="max"
        label={`Max: ${formatCurrency(filters.maxAmount)}`}
        size="small"
        onDelete={() => onRemove("maxAmount")}
      />
    );
  }

  return chips;
}

export function TransactionFiltersToolbar({
  search,
  filters,
  onSearchChange,
  onOpenFilters,
  onClearFilters,
  onRemoveFilter,
}: TransactionFiltersToolbarProps) {
  const drawerFilterCount = countActiveFilters({
    ...filters,
    search: undefined,
  });
  const hasSearch = Boolean(search.trim());
  const hasAnyFilter = drawerFilterCount > 0 || hasSearch;
  const chips = buildFilterChips(filters, onRemoveFilter);

  if (hasSearch) {
    chips.unshift(
      <Chip
        key="search"
        label={`Search: "${search.trim()}"`}
        size="small"
        onDelete={() => onSearchChange("")}
      />
    );
  }

  return (
    <Stack spacing={2} sx={{ p: { xs: 2, sm: 2.5 }, pb: { xs: 1.5, sm: 2 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search by title or category…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <Tooltip title="Filter transactions">
          <IconButton
            onClick={onOpenFilters}
            aria-label="Open filters"
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              flexShrink: 0,
              width: { xs: "100%", sm: 44 },
              height: 44,
            }}
          >
            <Badge color="primary" badgeContent={drawerFilterCount} invisible={drawerFilterCount === 0}>
              <FilterListOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Stack>

      {hasAnyFilter && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          {chips}
          <Button size="small" onClick={onClearFilters} sx={{ ml: { sm: 0.5 } }}>
            Clear all
          </Button>
        </Box>
      )}
    </Stack>
  );
}
