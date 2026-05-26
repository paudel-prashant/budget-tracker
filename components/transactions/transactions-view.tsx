"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import {
  SWIPE_HINT_STORAGE_KEY,
  TransactionSwipeableCard,
} from "@/components/transactions/transaction-swipeable-card";
import { StaggeredReveal } from "@/components/shared/ui/staggered-reveal";
import { TransactionFiltersDrawer } from "@/components/transactions/transaction-filters-drawer";
import { TransactionFiltersToolbar } from "@/components/transactions/transaction-filters-toolbar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { usePwa } from "@/components/pwa/pwa-provider";
import { useQuickTransaction } from "@/components/transactions/quick-transaction-provider";
import { MOBILE_NAV_BREAKPOINT } from "@/lib/config/layout-constants";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { TRANSACTION_UNDO_DELETE_MS } from "@/lib/config/undo-delete";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSoftDeleteTransaction } from "@/hooks/use-soft-delete-transaction";
import { useLoadMoreOnVisible } from "@/hooks/use-load-more-on-visible";
import { useMounted } from "@/hooks/use-mounted";
import { fetchWithCache, OfflineFetchError } from "@/lib/pwa/fetch-with-cache";
import { transactionsListCacheKey } from "@/lib/pwa/cache-keys";
import {
  buildTransactionListQuery,
  countActiveFilters,
  EMPTY_TRANSACTION_FILTERS,
  MOBILE_TRANSACTIONS_MAX_ROWS,
  MOBILE_TRANSACTIONS_PAGE_SIZE,
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
  const mounted = useMounted();
  const isMobileInfinite = useMediaQuery(
    theme.breakpoints.down(MOBILE_NAV_BREAKPOINT),
    { noSsr: true }
  );
  const useInfiniteList = mounted && isMobileInfinite;

  const { isOnline } = usePwa();
  const { openQuickAdd } = useQuickTransaction();
  const { showSuccess, showError, showInfo } = useSnackbar();

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
  const [mobilePage, setMobilePage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [filterVersion, setFilterVersion] = useState(0);
  const appliedFilterVersionRef = useRef(filterVersion);
  const silentNextListFetchRef = useRef(false);
  const pendingDeleteIdsRef = useRef<ReadonlySet<string>>(new Set());
  const refreshTransactionsRef = useRef<() => void>(() => {});

  useEffect(() => {
    setShowSwipeHint(sessionStorage.getItem(SWIPE_HINT_STORAGE_KEY) !== "1");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(debouncedSearch.trim()) || countActiveFilters(filters) > 0;
  }, [debouncedSearch, filters]);

  const fetchTransactions = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      options?: { silent?: boolean; append?: boolean }
    ) => {
      const append = options?.append ?? false;
      const silent = options?.silent ?? false;

      if (append) {
        setLoadingMore(true);
      } else if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const query = buildTransactionListQuery({
        ...filters,
        search: debouncedSearch.trim() || undefined,
        page: targetPage,
        pageSize: targetPageSize,
      });

      try {
        const cacheKey = transactionsListCacheKey(query);
        const result = await fetchWithCache<TransactionListResponse>(
          `/api/transactions?${query}`,
          cacheKey
        );

        const newRows = result.data.data;
        const pag = result.data.pagination;

        setFromCache(result.fromCache);
        setCategories(result.data.meta.categories);
        setTotalUnfiltered(result.data.meta.totalUnfiltered);
        setPagination(pag);

        setTransactions((prev) => {
          let merged: Transaction[];
          if (append) {
            const ids = new Set(prev.map((t) => t.id));
            merged = [
              ...prev,
              ...newRows.filter((t) => !ids.has(t.id)),
            ].slice(0, MOBILE_TRANSACTIONS_MAX_ROWS);
          } else {
            merged = newRows;
          }

          if (useInfiniteList) {
            const cap = Math.min(pag.total, MOBILE_TRANSACTIONS_MAX_ROWS);
            setHasMore(
              merged.length < cap && newRows.length === targetPageSize
            );
          } else {
            setHasMore(false);
          }

          const hidden = pendingDeleteIdsRef.current;
          return merged.filter((t) => !hidden.has(t.id));
        });
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
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [filters, debouncedSearch, useInfiniteList, showError, isOnline]
  );

  const refreshTransactions = useCallback(() => {
    silentNextListFetchRef.current = true;
    setPage(1);
    setMobilePage(1);
    setFilterVersion((v) => v + 1);
  }, []);

  refreshTransactionsRef.current = refreshTransactions;

  const showUndoToast = useCallback(
    (message: string, onUndo: () => void) => {
      showInfo(message, {
        autoHideMs: TRANSACTION_UNDO_DELETE_MS,
        action: { label: "Undo", onClick: onUndo },
      });
    },
    [showInfo]
  );

  const commitDelete = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to delete transaction");
        }

        window.dispatchEvent(new CustomEvent("budgetrax:transactions-changed"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete transaction";
        showError(message);
        refreshTransactionsRef.current();
      }
    },
    [showError]
  );

  const { scheduleDelete, pendingIds } = useSoftDeleteTransaction({
    onCommit: commitDelete,
    showUndoToast,
  });

  pendingDeleteIdsRef.current = pendingIds;

  useEffect(() => {
    const filtersJustChanged = appliedFilterVersionRef.current !== filterVersion;
    appliedFilterVersionRef.current = filterVersion;

    const targetPage = filtersJustChanged
      ? 1
      : useInfiniteList
        ? mobilePage
        : page;
    const targetPageSize = useInfiniteList ? MOBILE_TRANSACTIONS_PAGE_SIZE : pageSize;
    const append = useInfiniteList && targetPage > 1 && !filtersJustChanged;
    const silent = silentNextListFetchRef.current;
    silentNextListFetchRef.current = false;

    void fetchTransactions(targetPage, targetPageSize, { append, silent });
  }, [
    fetchTransactions,
    useInfiniteList,
    mobilePage,
    page,
    pageSize,
    filterVersion,
  ]);

  useEffect(() => {
    const refresh = () => void refreshTransactions();
    window.addEventListener("budgetrax:transactions-changed", refresh);
    return () => window.removeEventListener("budgetrax:transactions-changed", refresh);
  }, [refreshTransactions]);

  useEffect(() => {
    setPage(1);
    setMobilePage(1);
    setFilterVersion((v) => v + 1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!useInfiniteList) {
      setPage(1);
    }
  }, [pageSize, useInfiniteList]);

  useEffect(() => {
    if (!mounted) return;
    setPage(1);
    setMobilePage(1);
  }, [useInfiniteList, mounted]);

  const loadMoreMobile = useCallback(() => {
    if (!useInfiniteList || loading || loadingMore || !hasMore) return;
    setMobilePage((p) => p + 1);
  }, [useInfiniteList, loading, loadingMore, hasMore]);

  const loadMoreSentinelRef = useLoadMoreOnVisible(
    loadMoreMobile,
    useInfiniteList && hasMore && !loading && !loadingMore
  );

  const handleFormSuccess = (mode: "create" | "edit") => {
    refreshTransactions();
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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const transaction = deleteTarget;
    const index = transactions.findIndex((t) => t.id === transaction.id);
    setDeleteTarget(null);

    if (index < 0) return;

    void scheduleDelete(
      transaction,
      index,
      () => {
        setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
        setPagination((prev) => {
          const total = Math.max(0, prev.total - 1);
          return {
            ...prev,
            total,
            totalPages: Math.max(1, Math.ceil(total / prev.pageSize)),
          };
        });
        setTotalUnfiltered((prev) => Math.max(0, prev - 1));
      },
      (tx, atIndex) => {
        setTransactions((prev) => {
          if (prev.some((t) => t.id === tx.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(atIndex, next.length), 0, tx);
          return next;
        });
        setPagination((prev) => {
          const total = prev.total + 1;
          return {
            ...prev,
            total,
            totalPages: Math.max(1, Math.ceil(total / prev.pageSize)),
          };
        });
        setTotalUnfiltered((prev) => prev + 1);
      }
    );
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeleteTarget(transaction);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(EMPTY_TRANSACTION_FILTERS);
    setPage(1);
    setMobilePage(1);
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
    setMobilePage(1);
  };

  const handleApplyFilters = (next: TransactionFilters) => {
    setFilters(next);
    setPage(1);
    setMobilePage(1);
  };

  const showEmptyLedger = !loading && totalUnfiltered === 0;
  const showNoResults = !loading && pagination.total === 0 && totalUnfiltered > 0;

  const mobileListCapped =
    useInfiniteList &&
    pagination.total > MOBILE_TRANSACTIONS_MAX_ROWS &&
    transactions.length >= MOBILE_TRANSACTIONS_MAX_ROWS;

  const mobileListFooter = useInfiniteList && !loading && transactions.length > 0 && (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        py: 2,
        px: 2,
      }}
    >
      {loadingMore && <CircularProgress size={28} aria-label="Loading more transactions" />}
      {hasMore && <Box ref={loadMoreSentinelRef} sx={{ height: 1, width: "100%" }} aria-hidden />}
      {!hasMore && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {mobileListCapped
            ? `Showing first ${MOBILE_TRANSACTIONS_MAX_ROWS.toLocaleString()} of ${pagination.total.toLocaleString()} transactions`
            : `Showing ${transactions.length.toLocaleString()} transaction${transactions.length === 1 ? "" : "s"}`}
        </Typography>
      )}
    </Box>
  );

  return (
    <PageStack>
      <PageHeader
        title="Transactions"
        description="View and manage your income and expenses."
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreateDialog}
            sx={{
              minWidth: 180,
              display: { xs: "none", [MOBILE_NAV_BREAKPOINT]: "inline-flex" },
            }}
          >
            Add Transaction
          </Button>
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
        ) : (
          <>
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                flexDirection: "column",
                gap: 1.75,
                px: { xs: 2, sm: 2.5 },
                pb: mobileListFooter ? 0 : 2,
              }}
            >
              <StaggeredReveal staggerMs={45}>
                {transactions.map((transaction, index) => (
                  <TransactionSwipeableCard
                    key={`mobile-${transaction.id}`}
                    transaction={transaction}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    showSwipeHint={showSwipeHint && index === 0}
                    onSwipeHintSeen={() => setShowSwipeHint(false)}
                  />
                ))}
              </StaggeredReveal>
              {mobileListFooter}
            </Box>
            <TableContainer
              sx={{
                display: { xs: "none", md: "block" },
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
                      key={`desktop-${transaction.id}`}
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
          </>
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
            sx={{
              display: { xs: "none", md: "flex" },
              borderTop: 1,
              borderColor: "divider",
              px: { xs: 1, sm: 2 },
              "& .MuiTablePagination-toolbar": {
                minHeight: { xs: 48, md: 52 },
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
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageStack>
  );
}
