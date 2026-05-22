"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import {
  getProgressBarColor,
  getProgressBarValue,
} from "@/lib/budget-calculations";
import { formatCurrency, formatMonthYear, formatPercent } from "@/lib/format";
import { CARD_SHADOW } from "@/lib/layout-constants";
import type { BudgetHealth } from "@/lib/types";

type BudgetHealthWidgetProps = {
  health: BudgetHealth;
};

export function BudgetHealthWidget({ health }: BudgetHealthWidgetProps) {
  const hasBudgets = health.totalBudgets > 0;
  const progressColor = getProgressBarColor(health.overallPercentUsed, health.overBudget > 0);
  const progressValue = getProgressBarValue(health.overallPercentUsed);

  const stats = [
    { label: "On track", value: health.onTrack, color: "success.main" },
    { label: "At risk", value: health.atRisk, color: "warning.main" },
    { label: "Over budget", value: health.overBudget, color: "error.main" },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: "divider",
        width: "100%",
        boxShadow: CARD_SHADOW,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: hasBudgets ? 2 : 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            })}
          >
            <SavingsOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Budget Health
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatMonthYear(health.month, health.year)}
            </Typography>
          </Box>
        </Stack>
        <Button component={NextLink} href="/budget" size="small" variant="outlined">
          Manage budgets
        </Button>
      </Stack>

      {!hasBudgets ? (
        <Typography variant="body2" color="text.secondary">
          No category budgets for this month.{" "}
          <Box
            component={NextLink}
            href="/budget"
            sx={{ color: "primary.main", fontWeight: 500, textDecoration: "none" }}
          >
            Add limits
          </Box>{" "}
          to track spending against your plan.
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
          <ResponsiveColumns columns={{ xs: 3 }} gap={2}>
            {stats.map((stat) => (
              <Box key={stat.label}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {stat.label}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </ResponsiveColumns>
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total spent
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(health.totalSpent)} / {formatCurrency(health.totalLimit)}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressValue}
            color={progressColor}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "action.hover",
              mb: 0.75,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatPercent(health.overallPercentUsed)} of combined limits across{" "}
            {health.totalBudgets} {health.totalBudgets === 1 ? "category" : "categories"}
          </Typography>
        </>
      )}
    </Paper>
  );
}
