"use client";

import { Autocomplete, Chip, TextField } from "@mui/material";
import { formTextFieldProps } from "@/lib/theme/form-field";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  options?: string[];
  label?: string;
  disabled?: boolean;
};

/** Free-form multi-tag input with autocomplete suggestions from the user's existing tags. */
export function TagInput({
  value,
  onChange,
  options = [],
  label = "Tags (optional)",
  disabled = false,
}: TagInputProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      disabled={disabled}
      options={options}
      value={value}
      onChange={(_event, next) =>
        onChange(next.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
      }
      filterSelectedOptions
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return <Chip key={key} label={tag} size="small" {...chipProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          {...formTextFieldProps}
          label={label}
          placeholder={value.length === 0 ? "Type a tag and press Enter" : undefined}
        />
      )}
    />
  );
}
