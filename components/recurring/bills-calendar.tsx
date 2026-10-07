"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MonthNavigator } from "@/components/shared/ui/month-navigator";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { getCurrentMonthYear } from "@/lib/domain/budget-calculations";
import { getMonthDayKeys, toDayKey } from "@/lib/domain/bills-calendar";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatCurrencyAxis, formatDayKey } from "@/lib/utils/format";
import type { BillsCalendar as BillsCalendarData, BillsCalendarEvent } from "@/lib/data/bills-calendar-data";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 0 = Sunday, for the 1st of the month (date keys are calendar days, so no time zone). */
function firstWeekday(month: number, year: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function EventChip({ event }: { event: BillsCalendarEvent }) {
  const isIncome = event.type === "INCOME";
  return (
    <Tooltip title={`${event.title} · ${event.category}${event.isPast ? " · posted" : ""}`}>
      <Chip
        size="small"
        label={`${isIncome ? "+" : "−"}${formatCurrencyAxis(event.amount)} ${event.title}`}
        color={isIncome ? "success" : "default"}
        variant={event.isPast ? "outlined" : "filled"}
        sx={{
          height: 20,
          maxWidth: "100%",
          justifyContent: "flex-start",
          opacity: event.isPast ? 0.65 : 1,
          "& .MuiChip-label": { px: 0.75, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" },
        }}
      />
    </Tooltip>
  );
}

export function BillsCalendar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selected, setSelected] = useState(getCurrentMonthYear);
  const [data, setData] = useState<BillsCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    fetch(`/api/bills-calendar?month=${selected.month}&year=${selected.year}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Failed to load calendar");
        if (requestId === requestIdRef.current) setData(json as BillsCalendarData);
      })
      .catch((err: unknown) => {
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load calendar");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [selected]);

  const dayKeys = useMemo(() => getMonthDayKeys(selected.month, selected.year), [selected]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, BillsCalendarEvent[]>();
    for (const event of data?.events ?? []) {
      map.set(event.date, [...(map.get(event.date) ?? []), event]);
    }
    return map;
  }, [data]);

  const balanceByDay = useMemo(
    () => new Map((data?.forecast?.dailyBalances ?? []).map((day) => [day.date, day.balance])),
    [data]
  );

  const forecast = data?.forecast ?? null;
  const leadingBlanks = firstWeekday(selected.month, selected.year);
  const now = new Date();
  const todayKey = toDayKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const mobileDays = dayKeys.filter(
    (key) => eventsByDay.has(key) || (balanceByDay.get(key) ?? 0) < 0
  );

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1}
      >
        <MonthNavigator value={selected} onChange={setSelected} disabled={loading} />
        {data && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip size="small" color="success" variant="outlined" label={`Income ${formatCurrency(data.totals.income)}`} />
            <Chip size="small" variant="outlined" label={`Bills ${formatCurrency(data.totals.expenses)}`} />
            {data.totals.remainingExpenses > 0 && data.totals.remainingExpenses !== data.totals.expenses && (
              <Chip size="small" variant="outlined" label={`${formatCurrency(data.totals.remainingExpenses)} still to pay`} />
            )}
          </Stack>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && forecast?.shortfall && (
        <Alert severity="warning">
          You&apos;re projected to be short on <strong>{formatDayKey(forecast.shortfall.date)}</strong>{" "}
          (balance {formatCurrency(forecast.shortfall.balance)}). The forecast includes your
          scheduled bills and typical everyday spending — move money or a bill date to cover it.
        </Alert>
      )}
      {!loading && forecast && !forecast.shortfall && forecast.lowestBalance && (
        <Alert severity="success" variant="outlined">
          No shortfall projected this month. Lowest projected balance is{" "}
          {formatCurrency(forecast.lowestBalance.balance)} on {formatDayKey(forecast.lowestBalance.date)}.
        </Alert>
      )}
      {!loading && data && !forecast && (
        <Typography variant="body2" color="text.secondary">
          {dayKeys[dayKeys.length - 1] < todayKey
            ? "Past month — showing what was scheduled."
            : "Balance projections cover the next 180 days; this month shows scheduled items only."}
        </Typography>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={isMobile ? 320 : 520} />
      ) : isMobile ? (
        <SectionPanel>
          {mobileDays.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: CARD_PADDING }}>
              Nothing scheduled this month.
            </Typography>
          ) : (
            mobileDays.map((key) => (
                <Box key={key} sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="subtitle2">{formatDayKey(key)}</Typography>
                    {balanceByDay.has(key) && (
                      <Typography
                        variant="caption"
                        color={balanceByDay.get(key)! < 0 ? "error.main" : "text.secondary"}
                      >
                        Projected {formatCurrency(balanceByDay.get(key)!)}
                      </Typography>
                    )}
                  </Stack>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }} alignItems="flex-start">
                    {(eventsByDay.get(key) ?? []).map((event) => (
                      <EventChip key={`${event.recurringId}-${event.date}`} event={event} />
                    ))}
                  </Stack>
                </Box>
              ))
          )}
        </SectionPanel>
      ) : (
        <SectionPanel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {WEEKDAYS.map((weekday) => (
              <Typography
                key={weekday}
                variant="caption"
                color="text.secondary"
                sx={{ px: 1, py: 0.75, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}
              >
                {weekday}
              </Typography>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <Box key={`blank-${i}`} sx={{ borderBottom: 1, borderRight: 1, borderColor: "divider" }} />
            ))}
            {dayKeys.map((key, index) => {
              const balance = balanceByDay.get(key);
              const isShortfall = balance !== undefined && balance < 0;
              const isToday = key === todayKey;
              return (
                <Box
                  key={key}
                  sx={{
                    minHeight: 104,
                    p: 0.75,
                    borderBottom: 1,
                    borderRight: (leadingBlanks + index) % 7 === 6 ? 0 : 1,
                    borderColor: "divider",
                    bgcolor: isShortfall ? alpha(theme.palette.error.main, 0.08) : undefined,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={isToday ? 700 : 500}
                    color={isToday ? "primary.main" : "text.primary"}
                  >
                    {index + 1}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {(eventsByDay.get(key) ?? []).map((event) => (
                      <EventChip key={`${event.recurringId}-${event.date}`} event={event} />
                    ))}
                  </Stack>
                  {balance !== undefined && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 0.5, fontSize: 10.5 }}
                      color={isShortfall ? "error.main" : "text.secondary"}
                    >
                      {formatCurrencyAxis(balance)}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </SectionPanel>
      )}

      {forecast && (
        <Typography variant="caption" color="text.secondary">
          Small figures are the projected end-of-day balance across all accounts (
          {forecast.confidence.toLowerCase()} confidence), including your typical day-to-day
          spending on top of scheduled items.
        </Typography>
      )}
    </Stack>
  );
}
