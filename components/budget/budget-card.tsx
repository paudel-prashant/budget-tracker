"use client";

import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  getProgressBarColor,
  getProgressBarValue,
} from "@/lib/budget-calculations";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CARD_PADDING } from "@/lib/layout-constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetCardProps = {
  budget: BudgetWithProgress;
  onDelete: (budget: BudgetWithProgress) => void;
};

export function BudgetCard({ budget, onDelete }: BudgetCardProps) {
  const theme = useTheme();
  const progressColor = getProgressBarColor(budget.percentUsed, budget.isOverBudget);
  const progressValue = getProgressBarValue(budget.percentUsed);

  const statusLabel = budget.isOverBudget
    ? "Over budget"
    : budget.isAtRisk
      ? "At risk"
      : "On track";

  const statusColor = budget.isOverBudget
    ? "error"
    : budget.isAtRisk
      ? "warning"
      : "success";

  const accent =
    statusColor === "error"
      ? theme.palette.error.main
      : statusColor === "warning"
        ? theme.palette.warning.main
        : theme.palette.success.main;

  return (
    <SurfaceCard
      hover
      accentColor={accent}
      sx={{
        p: CARD_PADDING,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderColor: budget.isOverBudget ? alpha(theme.palette.error.main, 0.4) : "divider",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {budget.category}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Limit {formatCurrency(budget.monthlyLimit)}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip label={statusLabel} color={statusColor} size="small" variant="outlined" />
          <Tooltip title="Delete budget">
            <IconButton
              size="small"
              aria-label={`Delete ${budget.category} budget`}
              onClick={() => onDelete(budget)}
              sx={{ color: "text.secondary" }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box sx={{ mt: 3, mb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Spent
          </Typography>
          <Typography variant="body2" fontWeight={600} color="error.main">
            {formatCurrency(budget.spent)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {budget.remaining >= 0 ? "Remaining" : "Over by"}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            color={budget.remaining >= 0 ? "success.main" : "error.main"}
          >
            {formatCurrency(Math.abs(budget.remaining))}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          color={progressColor}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: alpha(theme.palette[progressColor].main, 0.12),
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: "block", fontWeight: 500 }}>
          {formatPercent(budget.percentUsed)} of budget used
        </Typography>
      </Box>
    </SurfaceCard>
  );
}
