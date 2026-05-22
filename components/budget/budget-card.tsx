"use client";

import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  getProgressBarColor,
  getProgressBarValue,
} from "@/lib/budget-calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetCardProps = {
  budget: BudgetWithProgress;
  onDelete: (budget: BudgetWithProgress) => void;
};

export function BudgetCard({ budget, onDelete }: BudgetCardProps) {
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

  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: budget.isOverBudget ? "error.main" : "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" noWrap>
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
            bgcolor: "action.hover",
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {formatPercent(budget.percentUsed)} of budget used
        </Typography>
      </Box>
    </Paper>
  );
}
