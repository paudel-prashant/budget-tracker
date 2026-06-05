"use client";

import NextLink from "next/link";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import type { ForecastEmptyState } from "@/lib/forecasting";

const EMPTY_STATE_COPY: Record<
  ForecastEmptyState,
  { title: string; description: string; action?: { href: string; label: string } }
> = {
  no_history: {
    title: "No transaction history yet",
    description: "Add income and expense transactions to generate a cash flow forecast.",
    action: { href: "/transactions", label: "Add transactions" },
  },
  insufficient_data: {
    title: "More data needed",
    description:
      "Keep tracking transactions for a couple of weeks to improve forecast accuracy.",
    action: { href: "/transactions", label: "View transactions" },
  },
  no_recurring: {
    title: "No recurring transactions",
    description:
      "Add salary, rent, subscriptions, and other recurring items for sharper projections.",
    action: { href: "/recurring", label: "Manage recurring" },
  },
};

type ForecastEmptyStatesProps = {
  states: ForecastEmptyState[];
};

export function ForecastEmptyStates({ states }: ForecastEmptyStatesProps) {
  if (states.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {states.map((state) => {
        const copy = EMPTY_STATE_COPY[state];
        return (
          <Alert
            key={state}
            severity="info"
            variant="outlined"
            icon={<TimelineOutlinedIcon fontSize="small" />}
          >
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              {copy.title}
            </Typography>
            <Typography variant="body2" sx={{ mb: copy.action ? 1.5 : 0 }}>
              {copy.description}
            </Typography>
            {copy.action && (
              <Button component={NextLink} href={copy.action.href} size="small" variant="outlined">
                {copy.action.label}
              </Button>
            )}
          </Alert>
        );
      })}
    </Stack>
  );
}
