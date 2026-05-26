"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Collapse,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { DialogDatePicker } from "@/components/shared/ui/dialog-date-picker";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import {
  DASHBOARD_DATE_PRESET_LABELS,
  DASHBOARD_DATE_PRESETS,
  formatDashboardDateRangeLabel,
  resolveDashboardDateRange,
} from "@/lib/domain/dashboard-date-range";
import type { DashboardDatePreset, DashboardDateRange } from "@/lib/types";

type DashboardDateRangeSelectorProps = {
  value: DashboardDateRange;
  loading?: boolean;
  onChange: (range: DashboardDateRange) => void;
};

export function DashboardDateRangeSelector({
  value,
  loading = false,
  onChange,
}: DashboardDateRangeSelectorProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(
    value.preset === "custom" ? dayjs(value.dateFrom) : null
  );
  const [customTo, setCustomTo] = useState<Dayjs | null>(
    value.preset === "custom" ? dayjs(value.dateTo) : null
  );

  useEffect(() => {
    if (value.preset === "custom") {
      setCustomFrom(dayjs(value.dateFrom));
      setCustomTo(dayjs(value.dateTo));
    }
  }, [value.dateFrom, value.dateTo, value.preset]);

  const handlePresetChange = (
    _event: React.MouseEvent<HTMLElement>,
    next: DashboardDatePreset | null
  ) => {
    if (!next || next === value.preset) {
      return;
    }

    if (next === "custom") {
      const fallbackFrom = customFrom ?? dayjs().subtract(30, "day");
      const fallbackTo = customTo ?? dayjs();
      setCustomFrom(fallbackFrom);
      setCustomTo(fallbackTo);
      onChange(
        resolveDashboardDateRange({
          preset: "custom",
          dateFrom: fallbackFrom.toISOString(),
          dateTo: fallbackTo.toISOString(),
        })
      );
      return;
    }

    onChange(resolveDashboardDateRange({ preset: next }));
  };

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      return;
    }
    onChange(
      resolveDashboardDateRange({
        preset: "custom",
        dateFrom: customFrom.toISOString(),
        dateTo: customTo.toISOString(),
      })
    );
  };

  const customInvalid =
    Boolean(customFrom && customTo && customFrom.isAfter(customTo, "day"));

  return (
    <SurfaceCard
      sx={{
        p: { xs: 2, sm: 2.5 },
        width: "100%",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {loading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
          }}
        />
      )}

      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthOutlinedIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Date range
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDashboardDateRangeLabel(value)}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <ToggleButtonGroup
          value={value.preset}
          exclusive
          onChange={handlePresetChange}
          size="small"
          aria-label="Dashboard date range"
          sx={{
            flexWrap: "wrap",
            gap: 0.75,
            width: "100%",
            "& .MuiToggleButtonGroup-grouped": {
              border: 1,
              borderColor: "divider",
              borderRadius: "10px !important",
              margin: 0,
              flex: compact ? "1 1 calc(50% - 6px)" : "0 1 auto",
              minWidth: compact ? 0 : undefined,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 1.75,
              py: 0.75,
            },
          }}
        >
          {DASHBOARD_DATE_PRESETS.map((preset) => (
            <ToggleButton key={preset} value={preset} disabled={loading}>
              {DASHBOARD_DATE_PRESET_LABELS[preset]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Collapse in={value.preset === "custom"}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "flex-end" }}
            >
              <DialogDatePicker
                label="From"
                value={customFrom}
                onChange={setCustomFrom}
                disabled={loading}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
              <DialogDatePicker
                label="To"
                value={customTo}
                onChange={setCustomTo}
                disabled={loading}
                minDate={customFrom ?? undefined}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
              <Button
                variant="contained"
                onClick={handleApplyCustom}
                disabled={loading || !customFrom || !customTo || customInvalid}
                sx={{ flexShrink: 0, minHeight: 40 }}
              >
                Apply
              </Button>
            </Stack>
          </LocalizationProvider>
          {customInvalid && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
              Start date must be on or before the end date.
            </Typography>
          )}
        </Collapse>
      </Stack>
    </SurfaceCard>
  );
}
