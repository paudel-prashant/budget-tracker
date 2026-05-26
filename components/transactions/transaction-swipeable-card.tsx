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
import type { Transaction } from "@/lib/types";

type TransactionSwipeableCardProps = {
  transaction: Transaction;
  deleting: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

const SWIPE_HINT_KEY = "budgetrax-swipe-hint-seen";

export function TransactionSwipeableCard({
  transaction,
  deleting,
  onEdit,
  onDelete,
}: TransactionSwipeableCardProps) {
  const isIncome = transaction.type === "INCOME";
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    setShowSwipeHint(sessionStorage.getItem(SWIPE_HINT_KEY) !== "1");
  }, []);

  const markHintSeen = () => {
    sessionStorage.setItem(SWIPE_HINT_KEY, "1");
    setShowSwipeHint(false);
  };

  return (
    <SwipeableRow
      disabled={deleting}
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
              <Typography variant="subtitle1" fontWeight={700} noWrap>
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
                  disabled={deleting}
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
                    disabled={deleting}
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
              fontWeight={700}
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
