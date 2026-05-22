"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import {
  buildCategoryOptions,
  isPresetCategory,
  OTHER_CATEGORY_OPTION,
} from "@/lib/domain/transaction-categories";
import type { TransactionType } from "@/lib/types";

const OTHER_SELECT_VALUE = "__category_other__";

/** MUI MenuItem row height (px) — keep in sync with theme if customized. */
const MENU_ITEM_HEIGHT = 48;
const MENU_VISIBLE_ROWS = 4;

const categoryMenuProps = {
  disableScrollLock: true,
  PaperProps: {
    sx: {
      maxHeight: MENU_ITEM_HEIGHT * MENU_VISIBLE_ROWS,
      overflowY: "auto",
    },
  },
  MenuListProps: {
    dense: false,
  },
};

type CategorySelectFieldProps = {
  value: string;
  onChange: (category: string) => void;
  extraCategories?: string[];
  transactionType?: TransactionType;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CategorySelectField({
  value,
  onChange,
  extraCategories = [],
  transactionType,
  label = "Category",
  required = true,
  disabled = false,
}: CategorySelectFieldProps) {
  const options = useMemo(
    () => buildCategoryOptions(extraCategories, transactionType),
    [extraCategories, transactionType]
  );

  const [selectValue, setSelectValue] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    const trimmed = value.trim();

    if (!trimmed) {
      setSelectValue("");
      setCustomCategory("");
      return;
    }

    if (isPresetCategory(trimmed, options)) {
      const match = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
      setSelectValue(match ?? trimmed);
      setCustomCategory("");
      return;
    }

    setSelectValue(OTHER_SELECT_VALUE);
    setCustomCategory(trimmed);
  }, [value, options]);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const next = event.target.value;

    if (next === OTHER_SELECT_VALUE) {
      setSelectValue(OTHER_SELECT_VALUE);
      onChange(customCategory.trim());
      return;
    }

    setSelectValue(next);
    setCustomCategory("");
    onChange(next);
  };

  const handleCustomChange = (custom: string) => {
    setCustomCategory(custom);
    onChange(custom.trim());
  };

  const labelId = "category-select-label";

  return (
    <Stack spacing={2}>
      <FormControl fullWidth required={required} disabled={disabled} sx={formFieldSx}>
        <InputLabel id={labelId} shrink>
          {label}
        </InputLabel>
        <Select
          labelId={labelId}
          label={label}
          value={selectValue}
          onChange={handleSelectChange}
          displayEmpty
          notched
          MenuProps={categoryMenuProps}
        >
          <MenuItem value="" disabled>
            <em>Select a category</em>
          </MenuItem>
          {options.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
          <MenuItem value={OTHER_SELECT_VALUE}>{OTHER_CATEGORY_OPTION}</MenuItem>
        </Select>
      </FormControl>

      {selectValue === OTHER_SELECT_VALUE && (
        <TextField
          {...formTextFieldProps}
          label="Custom category"
          value={customCategory}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Enter category name"
          required={required}
          disabled={disabled}
          autoFocus
        />
      )}
    </Stack>
  );
}
