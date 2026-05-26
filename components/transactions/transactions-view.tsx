"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { PageStack } from "@/components/shared/ui/page-stack";
import { EmptyState } from "@/components/shared/ui/empty-state";
import { TransactionsTableSkeleton } from "@/components/shared/ui/transactions-table-skeleton";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionSwipeableCard } from "@/components/transactions/transaction-swipeable-card";
import { StaggeredReveal } from "@/components/shared/ui/staggered-reveal";
import { TransactionFiltersDrawer } from "@/components/transactions/transaction-filters-drawer";
import { TransactionFiltersToolbar } from "@/components/transactions/transaction-filters-toolbar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { usePwa } from "@/components/pwa/pwa-provider";
import { useQuickTransaction } from "@/components/transactions/quick-transaction-provider";
import { useIsMobileNav } from "@/hooks/use-is-mobile-nav";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchWithCache, OfflineFetchError } from "@/lib/pwa/fetch-with-cache";
import { transactionsListCacheKey } from "@/lib/pwa/cache-keys";
import {
  buildTransactionListQuery,
  countActiveFilters,
  EMPTY_TRANSACTION_FILTERS,
} from "@/lib/domain/transaction-filters";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Transaction,
  TransactionFilters,
  TransactionListPagination,
  TransactionListResponse,
} from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function TransactionsView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isMobileNav = useIsMobileNav();
  const { isOnline } = usePwa();
  const { openQuickAdd } = useQuickTransaction();
  const { showSuccess, showError } = useSnackbar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<TransactionListPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_TRANSACTION_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const listQuery = useMemo(
    () =>
      buildTransactionListQuery({
        ...filters,
        search: debouncedSearch.trim() || undefined,
        page,
        pageSize,
      }),
    [filters, debouncedSearch, page, pageSize]
  );

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(debouncedSearch.trim()) ||
      countActiveFilters(filters) > 0
    );
  }, [debouncedSearch, filters]);

  const loadTransactions = useCallback(
    async (options?: { silent?: boolean }) => {
      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const cacheKey = transactionsListCacheKey(listQuery);
        const result = await fetchWithCache<TransactionListResponse>(
          `/api/transactions?${listQuery}`,
          cacheKey
        );

        setFromCache(result.fromCache);
        setTransactions(result.data.data);
        setPagination(result.data.pagination);
        setCategories(result.data.meta.categories);
        setTotalUnfiltered(result.data.meta.totalUnfiltered);
      } catch (err) {
        const message =
          err instanceof OfflineFetchError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong";
        setError(message);
        if (isOnline || !(err instanceof OfflineFetchError)) {
          showError(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [listQuery, showError, isOnline]
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const refresh = () => void loadTransactions({ silent: true });
    window.addEventListener("budgetrax:transactions-changed", refresh);
    return () => window.removeEventListener("budgetrax:transactions-changed", refresh);
  }, [loadTransactions]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, pageSize]);

  const handleFormSuccess = async (mode: "create" | "edit") => {
    await loadTransactions({ silent: true });
    showSuccess(
      mode === "edit"
        ? "Transaction updated successfully"
        : "Transaction created successfully"
    );
  };

  const openCreateDialog = () => {
    setEditTarget(null);
    openQuickAdd();
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditTarget(transaction);
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (formOpen) {
      setFormOpen(false);
      setEditTarget(null);
    }
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

      setDeleteTarget(null);
      showSuccess("Transaction deleted successfully");
      await loadTransactions({ silent: true });
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

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(EMPTY_TRANSACTION_FILTERS);
    setPage(1);
  };

  const handleRemoveFilter = (key: keyof TransactionFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === "dateFrom" || key === "dateTo") {
        delete next.dateFrom;
        delete next.dateTo;
      } else {
        delete next[key];
      }
      return next;
    });
    setPage(1);
  };

  const handleApplyFilters = (next: TransactionFilters) => {
    setFilters(next);
    setPage(1);
  };

  const showEmptyLedger = !loading && totalUnfiltered === 0;
  const showNoResults = !loading && pagination.total === 0 && totalUnfiltered > 0;

  return (
    <PageStack>
      <PageHeader
        title="Transactions"
        description="View and manage your income and expenses."
        action={
          !isMobileNav ? (
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={openCreateDialog}
              sx={{ minWidth: 180 }}
            >
              Add Transaction
            </Button>
          ) : undefined
        }
      />

      <OfflineBanner showingCachedData={fromCache || !isOnline} />

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionPanel
        sx={{
          opacity: refreshing ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {!showEmptyLedger && (
          <TransactionFiltersToolbar
            search={searchInput}
            filters={filters}
            onSearchChange={setSearchInput}
            onOpenFilters={() => setFiltersOpen(true)}
            onClearFilters={handleClearFilters}
            onRemoveFilter={handleRemoveFilter}
          />
        )}

        {loading ? (
          <TransactionsTableSkeleton />
        ) : showEmptyLedger ? (
          <EmptyState
            icon={ReceiptLongOutlinedIcon}
            title="No transactions yet"
            description="Start tracking your finances by adding your first income or expense."
            actionLabel="Add Transaction"
            onAction={openCreateDialog}
          />
        ) : showNoResults ? (
          <EmptyState
            icon={SearchOffOutlinedIcon}
            title="No matching transactions"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : isMobile ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.75,
              px: { xs: 2, sm: 2.5 },
              pb: 2,
            }}
          >
            <StaggeredReveal staggerMs={45}>
              {transactions.map((transaction) => (
                <TransactionSwipeableCard
                  key={transaction.id}
                  transaction={transaction}
                  deleting={deleting && deleteTarget?.id === transaction.id}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              ))}
            </StaggeredReveal>
          </Box>
        ) : (
          <TableContainer
            sx={{
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Table size="medium" sx={{ minWidth: 720 }}>
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
                  <TableRow
                    key={transaction.id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
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
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit transaction">
                          <IconButton
                            color="primary"
                            disabled={deleting && deleteTarget?.id === transaction.id}
                            onClick={() => openEditDialog(transaction)}
                            aria-label={`Edit ${transaction.title}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete transaction">
                          <span>
                            <IconButton
                              color="error"
                              disabled={deleting && deleteTarget?.id === transaction.id}
                              onClick={() => openDeleteDialog(transaction)}
                              aria-label={`Delete ${transaction.title}`}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && pagination.total > 0 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={Math.max(0, pagination.page - 1)}
            onPageChange={(_event, newPage) => setPage(newPage + 1)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(Number.parseInt(event.target.value, 10));
            }}
            rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
            size={isMobile ? "small" : "medium"}
            sx={{
              borderTop: 1,
              borderColor: "divider",
              px: { xs: 1, sm: 2 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
          />
        )}
      </SectionPanel>

      {hasActiveFilters && !loading && pagination.total > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
          Showing {pagination.total} filtered transaction{pagination.total === 1 ? "" : "s"}
          {totalUnfiltered > pagination.total
            ? ` of ${totalUnfiltered} total`
            : ""}
        </Typography>
      )}

      <TransactionFiltersDrawer
        open={filtersOpen}
        filters={filters}
        categories={categories}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
      />

      <TransactionFormDialog
        open={formOpen && Boolean(editTarget)}
        transaction={editTarget}
        extraCategories={categories}
        onClose={closeFormDialog}
        onSuccess={() => handleFormSuccess("edit")}
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
