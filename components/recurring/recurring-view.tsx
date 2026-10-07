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
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { EmptyState } from "@/components/shared/ui/empty-state";
import { DataTableHeadCell } from "@/components/shared/ui/data-table-head-cell";
import { TransactionsTableSkeleton } from "@/components/shared/ui/transactions-table-skeleton";
import {
  RecurringFormDialog,
  type RecurringPrefill,
} from "@/components/recurring/recurring-form-dialog";
import { BillsCalendar } from "@/components/recurring/bills-calendar";
import { SubscriptionSuggestionsPanel } from "@/components/recurring/subscription-suggestions-panel";
import { DeleteRecurringDialog } from "@/components/recurring/delete-recurring-dialog";
import { FrequencyBadge } from "@/components/recurring/frequency-badge";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { RecurringTransaction } from "@/lib/types";
import type {
  DetectedSuggestion,
  PriceIncreaseSuggestion,
  SubscriptionSuggestion,
} from "@/lib/domain/subscription-detection";

type RecurringTab = "list" | "calendar";

export function RecurringView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useSnackbar();

  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<RecurringTab>("list");
  const [suggestions, setSuggestions] = useState<DetectedSuggestion[]>([]);
  const [suggestionBusyKey, setSuggestionBusyKey] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<RecurringPrefill | null>(null);
  // Set while "Track as recurring" is open, so saving it also retires the suggestion.
  const [trackingKey, setTrackingKey] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch("/api/subscriptions/suggestions");
      if (!response.ok) return; // Suggestions are optional — the page works without them.
      const data = (await response.json()) as { suggestions: DetectedSuggestion[] };
      setSuggestions(data.suggestions);
    } catch {
      // Ignore: same as above.
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

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

  const handleFormSuccess = async () => {
    const wasEditing = Boolean(editTarget);
    await loadRecurring();
    if (trackingKey) {
      setSuggestions((prev) => prev.filter((item) => item.key !== trackingKey));
      setTrackingKey(null);
      void loadSuggestions();
    }
    showSuccess(
      wasEditing
        ? "Recurring transaction updated. Future entries use the new details."
        : "Recurring transaction created. Due entries are generated automatically."
    );
  };

  const handleAddClick = () => {
    setEditTarget(null);
    setPrefill(null);
    setTrackingKey(null);
    setDialogOpen(true);
  };

  const handleTrackSuggestion = (suggestion: SubscriptionSuggestion) => {
    setEditTarget(null);
    setPrefill({
      title: suggestion.title,
      amount: suggestion.amount,
      category: suggestion.category,
      frequency: suggestion.frequency,
      // Next expected charge, so the charges already recorded aren't posted twice.
      startDate: suggestion.nextExpectedDate,
    });
    setTrackingKey(suggestion.key);
    setDialogOpen(true);
  };

  const dismissSuggestion = async (suggestion: DetectedSuggestion) => {
    setSuggestionBusyKey(suggestion.key);
    try {
      const response = await fetch("/api/suggestions/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: suggestion.key }),
      });
      if (!response.ok) throw new Error("Failed to dismiss suggestion");
      setSuggestions((prev) => prev.filter((item) => item.key !== suggestion.key));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to dismiss suggestion");
    } finally {
      setSuggestionBusyKey(null);
    }
  };

  const updateRecurringPrice = async (suggestion: PriceIncreaseSuggestion) => {
    const item = recurring.find((candidate) => candidate.id === suggestion.recurringId);
    if (!item) return;

    setSuggestionBusyKey(suggestion.key);
    try {
      // PATCH is full-replace, so send the item unchanged apart from the amount.
      const response = await fetch(`/api/recurring-transactions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          amount: suggestion.priceChange.newAmount,
          type: item.type,
          category: item.category,
          frequency: item.frequency,
          startDate: item.startDate,
          endDate: item.endDate,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to update recurring transaction");
      }
      setSuggestions((prev) => prev.filter((candidate) => candidate.key !== suggestion.key));
      showSuccess(`${item.title} updated to ${formatCurrency(suggestion.priceChange.newAmount)}`);
      await loadRecurring();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update recurring transaction");
    } finally {
      setSuggestionBusyKey(null);
    }
  };

  const handleEditClick = (item: RecurringTransaction) => {
    setEditTarget(item);
    setDialogOpen(true);
  };

  const closeForm = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setPrefill(null);
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
            onClick={handleAddClick}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 200 } }}
          >
            Add Recurring
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_event, value: RecurringTab) => setTab(value)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="list" label="Recurring items" />
        <Tab value="calendar" label="Bills calendar" />
      </Tabs>

      {tab === "calendar" ? (
        <BillsCalendar />
      ) : (
        <>
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <SubscriptionSuggestionsPanel
            suggestions={suggestions}
            busyKey={suggestionBusyKey}
            onTrack={handleTrackSuggestion}
            onUpdatePrice={(suggestion) => void updateRecurringPrice(suggestion)}
            onDismiss={(suggestion) => void dismissSuggestion(suggestion)}
          />

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
                onAction={handleAddClick}
              />
            ) : (
              <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <DataTableHeadCell>Title</DataTableHeadCell>
                      <DataTableHeadCell align="right">Amount</DataTableHeadCell>
                      <DataTableHeadCell>Type</DataTableHeadCell>
                      <DataTableHeadCell>Category</DataTableHeadCell>
                      <DataTableHeadCell>Frequency</DataTableHeadCell>
                      <DataTableHeadCell>Start</DataTableHeadCell>
                      <DataTableHeadCell>End</DataTableHeadCell>
                      <DataTableHeadCell align="right">Actions</DataTableHeadCell>
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
                          <Tooltip title="Edit recurring transaction">
                            <span>
                              <IconButton
                                size="small"
                                disabled={deleting && deleteTarget?.id === item.id}
                                onClick={() => handleEditClick(item)}
                                aria-label={`Edit ${item.title}`}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
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
        </>
      )}

      <RecurringFormDialog
        open={dialogOpen}
        recurring={editTarget}
        prefill={prefill}
        extraCategories={knownCategories}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
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
