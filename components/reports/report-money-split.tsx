"use client";

import { Alert, Box, Stack, Typography, useTheme } from "@mui/material";
import { VizCard } from "@/components/shared/ui/viz/viz-card";
import { SegmentedBar } from "@/components/shared/ui/viz/segmented-bar";
import { getCategoricalPalette } from "@/lib/theme/chart-styles";
import { formatCurrency } from "@/lib/utils/format";

type ReportMoneySplitProps = {
  income: number;
  expenses: number;
};

/** "Of every dollar you earned…" — income split into what was spent and what was kept. */
export function ReportMoneySplit({ income, expenses }: ReportMoneySplitProps) {
  const theme = useTheme();
  const palette = getCategoricalPalette(theme);
  const saved = Math.max(0, income - expenses);
  const overspent = Math.max(0, expenses - income);
  const centsKept = income > 0 ? Math.round((saved / income) * 100) : 0;

  return (
    <VizCard title="Where your income went" subtitle="Spent vs saved this month">
      {income <= 0 && expenses <= 0 ? (
        <Typography variant="body2" color="text.secondary">
          No income or expenses this month.
        </Typography>
      ) : income <= 0 ? (
        <Alert severity="info" variant="outlined">
          No income recorded this month. You spent {formatCurrency(expenses)}.
        </Alert>
      ) : (
        <Stack spacing={2.5}>
          <Box>
            <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, fontWeight: 800, lineHeight: 1.1 }}>
              {centsKept}¢
            </Typography>
            <Typography variant="body2" color="text.secondary">
              kept from every dollar you earned{centsKept >= 20 ? " 🙌" : ""}
            </Typography>
          </Box>
          <SegmentedBar
            height={18}
            format={formatCurrency}
            segments={[
              { key: "spent", label: "Spent", value: Math.min(expenses, income), color: palette[1] },
              { key: "saved", label: "Saved", value: saved, color: palette[2] },
            ]}
          />
          {overspent > 0 && (
            <Alert severity="warning" variant="outlined">
              You spent {formatCurrency(overspent)} more than you earned this month.
            </Alert>
          )}
        </Stack>
      )}
    </VizCard>
  );
}
