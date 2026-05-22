"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionsTableSkeleton } from "@/components/ui/transactions-table-skeleton";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionMobileCard } from "@/components/transactions/transaction-mobile-card";
import { useSnackbar } from "@/components/providers/snackbar-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionsView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useSnackbar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTransactions = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/transactions");

      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }

      const data: Transaction[] = await response.json();
      setTransactions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleCreateSuccess = async () => {
    await loadTransactions({ silent: true });
    showSuccess("Transaction created successfully");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/transactions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete transaction");
      }

      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      showSuccess("Transaction deleted successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete transaction";
      showError(message);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeleteTarget(transaction);
  };

  return (
    <PageStack>
      <PageHeader
        title="Transactions"
        description="View and manage your income and expenses."
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 180 } }}
          >
            Add Transaction
          </Button>
        }
      />

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          opacity: refreshing ? 0.7 : 1,
          transition: "opacity 0.2s ease",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <TransactionsTableSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptLongOutlinedIcon}
            title="No transactions yet"
            description="Start tracking your finances by adding your first income or expense."
            actionLabel="Add Transaction"
            onAction={() => setDialogOpen(true)}
          />
        ) : isMobile ? (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {transactions.map((transaction) => (
              <TransactionMobileCard
                key={transaction.id}
                transaction={transaction}
                deleting={deleting && deleteTarget?.id === transaction.id}
                onDelete={openDeleteDialog}
              />
            ))}
          </Stack>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {transaction.title}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color:
                          transaction.type === "INCOME"
                            ? "success.main"
                            : "error.main",
                      }}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type === "INCOME" ? "Income" : "Expense"}
                        color={transaction.type === "INCOME" ? "success" : "error"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete transaction">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deleting && deleteTarget?.id === transaction.id}
                            onClick={() => openDeleteDialog(transaction)}
                            aria-label={`Delete ${transaction.title}`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <AddTransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteTransactionDialog
        transaction={deleteTarget}
        open={Boolean(deleteTarget)}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageStack>
  );
}
