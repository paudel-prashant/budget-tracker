"use client";

import { useState } from "react";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { IconButton, InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker, type DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import type { TextFieldProps } from "@mui/material";
import type { Dayjs } from "dayjs";

type DialogDatePickerProps = Omit<
  DatePickerProps<Dayjs>,
  "slotProps" | "slots" | "desktopModeMediaQuery" | "open" | "onOpen" | "onClose"
> & {
  slotProps?: DatePickerProps<Dayjs>["slotProps"];
  slots?: DatePickerProps<Dayjs>["slots"];
  textFieldProps?: TextFieldProps;
};

function mergeTextFieldProps(
  onOpen: () => void,
  textFieldProps?: TextFieldProps,
  slotTextField?: TextFieldProps | Record<string, unknown>
): TextFieldProps {
  const base: TextFieldProps = { ...textFieldProps, ...(slotTextField as TextFieldProps) };

  return {
    ...base,
    onClick: (event) => {
      base.onClick?.(event);
      onOpen();
    },
    InputProps: {
      ...base.InputProps,
      endAdornment: (
        <>
          {base.InputProps?.endAdornment}
          <InputAdornment position="end">
            <IconButton
              edge="end"
              size="small"
              aria-label="Choose date"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        </>
      ),
    },
  };
}

/**
 * DatePicker for MUI Dialogs — opens a centered calendar dialog (avoids broken popper
 * positioning inside modals) with a calendar icon on the input.
 */
export function DialogDatePicker({
  slotProps,
  slots,
  textFieldProps,
  ...pickerProps
}: DialogDatePickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <DatePicker
      {...pickerProps}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      desktopModeMediaQuery="@media (min-width: 99999px)"
      slots={slots}
      slotProps={{
        ...slotProps,
        dialog: {
          sx: { zIndex: theme.zIndex.modal + 2 },
          ...slotProps?.dialog,
        },
        mobilePaper: {
          sx: {
            width: "min(360px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 48px)",
          },
          ...slotProps?.mobilePaper,
        },
        textField: mergeTextFieldProps(
          handleOpen,
          textFieldProps,
          slotProps?.textField as TextFieldProps | undefined
        ),
      }}
    />
  );
}
