"use client";

import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

type TransactionMobileCardProps = {
  transaction: Transaction;
  deleting: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionMobileCard({
  transaction,
  deleting,
  onEdit,
  onDelete,
}: TransactionMobileCardProps) {
  const isIncome = transaction.type === "INCOME";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {transaction.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transaction.category} · {formatDate(transaction.date)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} flexShrink={0}>
            <Tooltip title="Edit transaction">
              <IconButton
                size="small"
                color="primary"
                disabled={deleting}
                onClick={() => onEdit(transaction)}
                aria-label={`Edit ${transaction.title}`}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete transaction">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={deleting}
                  onClick={() => onDelete(transaction)}
                  aria-label={`Delete ${transaction.title}`}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
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
            fontWeight={600}
            color={isIncome ? "success.main" : "error.main"}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
