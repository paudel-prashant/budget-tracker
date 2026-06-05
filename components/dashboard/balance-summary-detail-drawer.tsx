"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { WidgetFooter, WidgetLinkButton } from "@/components/dashboard/widget-actions";
import { useMounted } from "@/hooks/use-mounted";
import {
  formatDashboardDateRangeLabel,
  resolveDashboardDateRange,
} from "@/lib/domain/dashboard-date-range";
import { buildTransactionListQuery } from "@/lib/domain/transaction-filters";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { DashboardDateRange, Summary, Transaction, TransactionType } from "@/lib/types";

export type BalanceSummaryKind = "income" | "expenses" | "balance";

const KIND_META: Record<
  BalanceSummaryKind,
  { title: string; description: string; totalLabel: string }
> = {
  income: {
    title: "Total Income",
    description: "Income transactions in the selected period",
    totalLabel: "Total income",
  },
  expenses: {
    title: "Total Expenses",
    description: "Expense transactions in the selected period",
    totalLabel: "Total expenses",
  },
  balance: {
    title: "Net Balance",
    description: "Income and expenses contributing to net balance",
    totalLabel: "Net balance",
  },
};

type BalanceSummaryDetailDrawerProps = {
  open: boolean;
  kind: BalanceSummaryKind | null;
  summary: Summary;
  dateRange: DashboardDateRange;
  onClose: () => void;
};

function totalForKind(kind: BalanceSummaryKind, summary: Summary): number {
  switch (kind) {
    case "income":
      return summary.totalIncome;
    case "expenses":
      return summary.totalExpenses;
    case "balance":
      return summary.netBalance;
  }
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "INCOME";

  return (
    <ListItem
      disablePadding
      sx={{
        py: 1.25,
        px: 0,
        alignItems: "flex-start",
        borderBottom: 1,
        borderColor: "divider",
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <ListItemText
        primary={
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {transaction.title}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary" component="span">
            {transaction.category} · {formatDate(transaction.date)}
          </Typography>
        }
        sx={{ m: 0, pr: 1 }}
      />
      <Stack spacing={0.5} alignItems="flex-end" flexShrink={0}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: isIncome ? "success.main" : "error.main" }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </Typography>
        <Chip
          label={isIncome ? "Income" : "Expense"}
          size="small"
          variant="outlined"
          color={isIncome ? "success" : "error"}
          sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.6875rem" } }}
        />
      </Stack>
    </ListItem>
  );
}

function TransactionSection({
  title,
  transactions,
  total,
  type,
}: {
  title: string;
  transactions: Transaction[];
  total: number;
  type: TransactionType;
}) {
  const isIncome = type === "INCOME";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: isIncome ? "success.main" : "error.main" }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(total)}
        </Typography>
      </Stack>
      {transactions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No {isIncome ? "income" : "expense"} transactions in this period.
        </Typography>
      ) : (
        <List disablePadding>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </List>
      )}
    </Box>
  );
}

export function BalanceSummaryDetailDrawer({
  open,
  kind,
  summary,
  dateRange,
  onClose,
}: BalanceSummaryDetailDrawerProps) {
  const theme = useTheme();
  const mounted = useMounted();
  const matchesSmall = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const anchorBottom = mounted && matchesSmall;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!kind) return;

    setLoading(true);
    setError(null);

    try {
      const resolved = resolveDashboardDateRange(dateRange);
      const query = buildTransactionListQuery({
        page: 1,
        pageSize: 100,
        type: kind === "income" ? "INCOME" : kind === "expenses" ? "EXPENSE" : undefined,
        dateFrom: resolved.dateFrom,
        dateTo: resolved.dateTo,
      });

      const response = await fetch(`/api/transactions?${query}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to load transactions");
      }

      const data = await response.json();
      setTransactions(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setTransactions([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [kind, dateRange]);

  useEffect(() => {
    if (open && kind) {
      void fetchTransactions();
    } else if (!open) {
      setTransactions([]);
      setTotal(0);
      setError(null);
    }
  }, [open, kind, fetchTransactions]);

  const meta = kind ? KIND_META[kind] : null;
  const periodLabel = formatDashboardDateRangeLabel(dateRange);

  const { incomeRows, expenseRows } = useMemo(() => {
    if (kind !== "balance") {
      return { incomeRows: [], expenseRows: [] };
    }
    return {
      incomeRows: transactions.filter((t) => t.type === "INCOME"),
      expenseRows: transactions.filter((t) => t.type === "EXPENSE"),
    };
  }, [kind, transactions]);

  const truncated = total > transactions.length;

  return (
    <Drawer
      anchor={anchorBottom ? "bottom" : "right"}
      open={open && kind !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 400, md: 440 },
            maxHeight: { xs: "92dvh", sm: "100%" },
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">{meta?.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {meta?.description}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
            {periodLabel}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close details" sx={{ mt: -0.5 }}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, py: 2, flexShrink: 0, bgcolor: "action.hover" }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          {meta?.totalLabel}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color:
              kind === "income"
                ? "success.main"
                : kind === "expenses"
                  ? "error.main"
                  : summary.netBalance >= 0
                    ? "primary.main"
                    : "error.main",
          }}
        >
          {kind ? formatCurrency(totalForKind(kind, summary)) : "—"}
        </Typography>
        {!loading && total > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            {total} transaction{total === 1 ? "" : "s"}
            {truncated ? ` · showing first ${transactions.length}` : ""}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : kind === "balance" ? (
          <Stack spacing={2.5} divider={<Divider />}>
            <TransactionSection
              title="Income"
              transactions={incomeRows}
              total={summary.totalIncome}
              type="INCOME"
            />
            <TransactionSection
              title="Expenses"
              transactions={expenseRows}
              total={summary.totalExpenses}
              type="EXPENSE"
            />
          </Stack>
        ) : transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No transactions in this period.
          </Typography>
        ) : (
          <List disablePadding>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </List>
        )}
      </Box>

      <WidgetFooter sx={{ mt: 0, px: 2.5, py: 2, flexShrink: 0 }}>
        <WidgetLinkButton href="/transactions">View all transactions</WidgetLinkButton>
      </WidgetFooter>
    </Drawer>
  );
}
