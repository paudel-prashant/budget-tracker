"use client";

import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { CategoryIcon } from "@/components/shared/ui/category-icon";
import { VizCard } from "@/components/shared/ui/viz/viz-card";
import { formatCurrency } from "@/lib/utils/format";
import type { RecurringForecastEvent } from "@/lib/forecasting";

type ForecastUpcomingEventsProps = {
  events: RecurringForecastEvent[];
};

function dateParts(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return {
    day: date.getUTCDate(),
    month: date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
    weekday: date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
  };
}

/** The next scheduled bills and paydays baked into the forecast. */
export function ForecastUpcomingEvents({ events }: ForecastUpcomingEventsProps) {
  const theme = useTheme();

  return (
    <VizCard title="Upcoming money moves" subtitle="Recurring bills and income in this forecast">
      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recurring items scheduled in this window. Add salary, rent and subscriptions as
          recurring to see them here.
        </Typography>
      ) : (
        <Stack spacing={0} component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {events.map((event, index) => {
            const parts = dateParts(event.date);
            const isIncome = event.type === "INCOME";
            return (
              <Stack
                component="li"
                key={`${event.recurringId}-${event.date}`}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  py: 1.25,
                  borderTop: index === 0 ? 0 : 1,
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    flexShrink: 0,
                    textAlign: "center",
                    borderRadius: 1.5,
                    py: 0.5,
                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "text.secondary", lineHeight: 1.2 }}>
                    {parts.month}
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{parts.day}</Typography>
                </Box>
                <CategoryIcon category={event.category} size="medium" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {parts.weekday} · {event.category}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: isIncome ? "success.main" : "text.primary", flexShrink: 0 }}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(event.amount)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </VizCard>
  );
}
