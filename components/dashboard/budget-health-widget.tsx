"use client";

import {
  Box,
  LinearProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { WidgetInlineLink, WidgetLinkButton } from "@/components/dashboard/widget-actions";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import {
  getProgressBarColor,
  getProgressBarValue,
} from "@/lib/domain/budget-calculations";
import { formatCurrency, formatMonthYear, formatPercent } from "@/lib/utils/format";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import type { BudgetHealth } from "@/lib/types";

type BudgetHealthWidgetProps = {
  health: BudgetHealth;
  embedded?: boolean;
};

export function BudgetHealthWidget({ health, embedded = false }: BudgetHealthWidgetProps) {
  const hasBudgets = health.totalBudgets > 0;
  const progressColor = getProgressBarColor(health.overallPercentUsed, health.overBudget > 0);
  const progressValue = getProgressBarValue(health.overallPercentUsed);

  const stats = [
    { label: "On track", value: health.onTrack, color: "success.main" },
    { label: "At risk", value: health.atRisk, color: "warning.main" },
    { label: "Over budget", value: health.overBudget, color: "error.main" },
  ];

  const content = (
    <>
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
        <WidgetLinkButton href="/budget">Manage budgets</WidgetLinkButton>
      </Stack>

      {!hasBudgets ? (
        <Typography variant="body2" color="text.secondary">
          No category budgets for this month. <WidgetInlineLink href="/budget">Add limits</WidgetInlineLink>{" "}
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
    </>
  );

  if (embedded) {
    return <Box sx={{ width: "100%", minWidth: 0 }}>{content}</Box>;
  }

  return <SurfaceCard sx={{ p: CARD_PADDING, width: "100%" }}>{content}</SurfaceCard>;
}
