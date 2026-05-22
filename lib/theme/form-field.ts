import type { SxProps, Theme } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

/** Uniform outlined control height aligned with theme (52px). */
export const formFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    minHeight: 52,
  },
  "& .MuiInputBase-input": {
    padding: "14px 16px",
    fontSize: "0.9375rem",
    boxSizing: "border-box",
  },
  "& .MuiSelect-select": {
    padding: "14px 16px",
    minHeight: 22,
    fontSize: "0.9375rem",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },
};

/** Shared props for dialog/form fields — consistent size, variant, and label. */
export const formTextFieldProps: Pick<TextFieldProps, "variant" | "size" | "fullWidth" | "slotProps" | "sx"> = {
  variant: "outlined",
  size: "medium",
  fullWidth: true,
  slotProps: {
    inputLabel: {
      shrink: true,
    },
  },
  sx: formFieldSx,
};
