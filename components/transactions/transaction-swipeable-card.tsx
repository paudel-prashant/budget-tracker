"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { SwipeableRow } from "@/components/shared/ui/swipeable-row";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { touchIconButtonSx } from "@/lib/theme/touch-targets";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cardTitleSx } from "@/lib/theme/typography";
import type { Transaction } from "@/lib/types";

export const SWIPE_HINT_STORAGE_KEY = "budgetrax-swipe-hint-seen";

type TransactionSwipeableCardProps = {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showSwipeHint?: boolean;
  onSwipeHintSeen?: () => void;
};

export function TransactionSwipeableCard({
  transaction,
  onEdit,
  onDelete,
  showSwipeHint: showSwipeHintProp,
  onSwipeHintSeen,
}: TransactionSwipeableCardProps) {
  const isIncome = transaction.type === "INCOME";
  const [localHint, setLocalHint] = useState(false);

  useEffect(() => {
    if (showSwipeHintProp !== undefined) return;
    setLocalHint(sessionStorage.getItem(SWIPE_HINT_STORAGE_KEY) !== "1");
  }, [showSwipeHintProp]);

  const showSwipeHint = showSwipeHintProp ?? localHint;

  const markHintSeen = () => {
    sessionStorage.setItem(SWIPE_HINT_STORAGE_KEY, "1");
    setLocalHint(false);
    onSwipeHintSeen?.();
  };

  return (
    <SwipeableRow
      leadingAction={{
        id: "edit",
        label: "Edit",
        icon: <EditOutlinedIcon sx={{ fontSize: 22 }} />,
        color: "primary",
        onTrigger: () => {
          markHintSeen();
          onEdit(transaction);
        },
      }}
      trailingAction={{
        id: "delete",
        label: "Delete",
        icon: <DeleteOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
        color: "error",
        onTrigger: () => {
          markHintSeen();
          onDelete(transaction);
        },
      }}
    >
      <SurfaceCard
        hover={false}
        sx={{
          p: 2,
          borderLeft: 4,
          borderLeftColor: isIncome ? "success.main" : "error.main",
          borderRadius: 2.5,
          boxShadow: "none",
        }}
      >
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap sx={cardTitleSx}>
                {transaction.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transaction.category} · {formatDate(transaction.date)}
              </Typography>
              {showSwipeHint && (
                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
                  Swipe right to edit · left to delete
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.5} flexShrink={0} sx={{ display: { xs: "none", sm: "flex" } }}>
              <Tooltip title="Edit transaction">
                <IconButton
                  color="primary"
                  onClick={() => onEdit(transaction)}
                  aria-label={`Edit ${transaction.title}`}
                  sx={touchIconButtonSx}
                >
                  <EditOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete transaction">
                <span>
                  <IconButton
                    color="error"
                    onClick={() => onDelete(transaction)}
                    aria-label={`Delete ${transaction.title}`}
                    sx={touchIconButtonSx}
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Chip
              label={isIncome ? "Income" : "Expense"}
              color={isIncome ? "success" : "error"}
              size="small"
              variant="outlined"
            />
            <Typography
              variant="subtitle1"
              sx={cardTitleSx}
              color={isIncome ? "success.main" : "error.main"}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </Typography>
          </Box>
        </Stack>
      </SurfaceCard>
    </SwipeableRow>
  );
}
