import type { TextFieldProps } from "@mui/material";

/** Keeps the calendar inside the viewport when used inside dialogs and drawers. */
export const dialogDatePickerPopperProps = {
  strategy: "fixed" as const,
  modifiers: [
    { name: "flip" as const, enabled: true },
    {
      name: "preventOverflow" as const,
      enabled: true,
      options: {
        rootBoundary: "viewport" as const,
        altBoundary: true,
        padding: 12,
      },
    },
  ],
  sx: { zIndex: 1400 },
};

export function dialogDatePickerSlotProps(textField?: TextFieldProps) {
  return {
    popper: dialogDatePickerPopperProps,
    ...(textField ? { textField } : {}),
  };
}
