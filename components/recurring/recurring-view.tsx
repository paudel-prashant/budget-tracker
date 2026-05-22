"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
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
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionsTableSkeleton } from "@/components/ui/transactions-table-skeleton";
import { AddRecurringDialog } from "@/components/recurring/add-recurring-dialog";
import { DeleteRecurringDialog } from "@/components/recurring/delete-recurring-dialog";
import { FrequencyBadge } from "@/components/recurring/frequency-badge";
import { useSnackbar } from "@/components/providers/snackbar-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurringTransaction } from "@/lib/types";

export function RecurringView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useSnackbar();

  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecurring = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurring-transactions");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to load recurring transactions");
      }

      const data: RecurringTransaction[] = await response.json();
      setRecurring(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadRecurring();
  }, [loadRecurring]);

  const handleCreateSuccess = async () => {
    await loadRecurring();
    showSuccess("Recurring transaction created. Due entries are generated automatically.");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/recurring-transactions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete recurring transaction");
      }

      setRecurring((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      showSuccess("Recurring transaction deleted");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to delete recurring transaction"
      );
    } finally {
      setDeleting(false);
    }
  };

  const knownCategories = useMemo(
    () => recurring.map((item) => item.category),
    [recurring]
  );

  return (
    <PageStack>
      <PageHeader
        title="Recurring"
        description="Automate income and expenses on a schedule. Transactions are generated when you open this page or Transactions."
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 200 } }}
          >
            Add Recurring
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
          overflow: "hidden",
        }}
      >
        {loading ? (
          <TransactionsTableSkeleton />
        ) : recurring.length === 0 ? (
          <EmptyState
            icon={AutorenewOutlinedIcon}
            title="No recurring transactions"
            description="Set up repeating income or expenses—like rent, salary, or subscriptions."
            actionLabel="Add Recurring"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recurring.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.title}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color: item.type === "INCOME" ? "success.main" : "error.main",
                      }}
                    >
                      {item.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.type === "INCOME" ? "Income" : "Expense"}
                        color={item.type === "INCOME" ? "success" : "error"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <FrequencyBadge frequency={item.frequency} />
                    </TableCell>
                    <TableCell>{formatDate(item.startDate)}</TableCell>
                    <TableCell>
                      {item.endDate ? formatDate(item.endDate) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete recurring transaction">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deleting && deleteTarget?.id === item.id}
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Delete ${item.title}`}
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

      <AddRecurringDialog
        open={dialogOpen}
        extraCategories={knownCategories}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteRecurringDialog
        recurring={deleteTarget}
        open={Boolean(deleteTarget)}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageStack>
  );
}
