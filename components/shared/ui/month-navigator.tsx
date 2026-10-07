"use client";

import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  getCurrentMonthYear,
  getNextMonthYear,
  getPreviousMonthYear,
} from "@/lib/domain/budget-calculations";
import { formatMonthYear } from "@/lib/utils/format";

type MonthYear = { month: number; year: number };

type MonthNavigatorProps = {
  value: MonthYear;
  onChange: (value: MonthYear) => void;
  disabled?: boolean;
};

export function MonthNavigator({ value, onChange, disabled }: MonthNavigatorProps) {
  const current = getCurrentMonthYear();
  const isCurrent = value.month === current.month && value.year === current.year;

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
      <Tooltip title="Previous month">
        <span>
          <IconButton
            aria-label="Previous month"
            disabled={disabled}
            onClick={() => onChange(getPreviousMonthYear(value.month, value.year))}
          >
            <ChevronLeftIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ minWidth: 150, textAlign: "center" }}
        aria-live="polite"
      >
        {formatMonthYear(value.month, value.year)}
      </Typography>
      <Tooltip title="Next month">
        <span>
          <IconButton
            aria-label="Next month"
            disabled={disabled}
            onClick={() => onChange(getNextMonthYear(value.month, value.year))}
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>
      {!isCurrent && (
        <Button size="small" disabled={disabled} onClick={() => onChange(current)}>
          This month
        </Button>
      )}
    </Stack>
  );
}
