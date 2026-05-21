import type { SxProps, Theme } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

/** Uniform 56px outlined control height (MUI medium standard). */
export const formFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    minHeight: 56,
  },
  "& .MuiInputBase-input": {
    padding: "16.5px 14px",
    boxSizing: "border-box",
  },
  "& .MuiSelect-select": {
    padding: "16.5px 14px",
    minHeight: 23,
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
