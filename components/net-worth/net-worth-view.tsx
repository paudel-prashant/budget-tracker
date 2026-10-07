"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { EmptyState } from "@/components/shared/ui/empty-state";
import { StatCard } from "@/components/shared/ui/stat-card";
import { NetWorthGrowthChart } from "@/components/dashboard/net-worth-growth-chart";
import { NetWorthItemCard } from "@/components/net-worth/net-worth-item-card";
import { AssetLiabilityDialog } from "@/components/net-worth/asset-liability-dialog";
import { DeleteNetWorthItemDialog } from "@/components/net-worth/delete-net-worth-item-dialog";
import { MoveToAccountDialog, type MoveTarget } from "@/components/net-worth/move-to-account-dialog";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { ACCOUNT_TYPE_LABELS } from "@/components/accounts/account-form-dialog";
import { suggestAccountTypeForNetWorthItem } from "@/lib/domain/account-net-worth";
import Link from "next/link";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { Asset, Liability, NetWorthAccountItem, NetWorthDashboardData } from "@/lib/types";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";

type TabValue = "assets" | "liabilities";

export function NetWorthView() {
  const { showSuccess, showError } = useSnackbar();
  const [tab, setTab] = useState<TabValue>("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [summary, setSummary] = useState<NetWorthDashboardData["current"] | null>(null);
  const [history, setHistory] = useState<NetWorthDashboardData["history"]>([]);
  const [accounts, setAccounts] = useState<NetWorthAccountItem[]>([]);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogKind, setDialogKind] = useState<"asset" | "liability">("asset");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Asset | Liability | null>(null);
  const [deleteKind, setDeleteKind] = useState<"asset" | "liability">("asset");
  const [deleteTarget, setDeleteTarget] = useState<Asset | Liability | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assetsRes, liabilitiesRes, dashboardRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/liabilities"),
        fetch("/api/net-worth"),
      ]);

      if (!assetsRes.ok || !liabilitiesRes.ok) {
        const failed = !assetsRes.ok ? assetsRes : liabilitiesRes;
        const data = await failed.json();
        throw new Error(data.error ?? "Failed to load net worth data");
      }

      const assetsData: Asset[] = await assetsRes.json();
      const liabilitiesData: Liability[] = await liabilitiesRes.json();
      setAssets(assetsData);
      setLiabilities(liabilitiesData);

      if (dashboardRes.ok) {
        const dashboard: NetWorthDashboardData = await dashboardRes.json();
        setSummary(dashboard.current);
        setHistory(dashboard.history);
        setAccounts(dashboard.accounts ?? []); // absent in responses cached by older versions
      } else {
        const totalAssets = assetsData.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = liabilitiesData.reduce((sum, l) => sum + l.value, 0);
        setSummary({
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
          savingsRate: null,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          monthlySavings: 0,
          netWorthChangePercent: null,
          accountAssets: 0,
          accountLiabilities: 0,
        });
        setHistory([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeItems = tab === "assets" ? assets : liabilities;
  const activeKind = tab === "assets" ? "asset" : "liability";
  const assetAccounts = accounts.filter((account) => account.asset > 0);
  const liabilityAccounts = accounts.filter((account) => account.liability > 0);
  const activeAccounts = tab === "assets" ? assetAccounts : liabilityAccounts;

  /** A manual item named like an account ("TFSA" vs "TFSA") is probably double-counted. */
  const findDuplicateAccount = (item: Asset | Liability): string | null => {
    const name = item.name.trim().toLowerCase();
    const match = accounts.find((account) => {
      const accountName = account.name.trim().toLowerCase();
      if (accountName === name) return true;
      // Containment only for real words, so "a" or "TD" don't match everything.
      const [shorter, longer] =
        accountName.length < name.length ? [accountName, name] : [name, accountName];
      return shorter.length >= 4 && longer.includes(shorter);
    });
    return match?.name ?? null;
  };

  const computedSummary = useMemo(() => {
    if (summary) return summary;
    const totalAssets = assets.reduce((s, a) => s + a.value, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      savingsRate: null,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      netWorthChangePercent: null,
      accountAssets: 0,
      accountLiabilities: 0,
    };
  }, [summary, assets, liabilities]);

  const openAdd = () => {
    setDialogKind(activeKind);
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Asset | Liability) => {
    const kind = assets.some((a) => a.id === item.id) ? "asset" : "liability";
    setDialogKind(kind);
    setEditItem(item);
    setDialogOpen(true);
  };

  const openDelete = (item: Asset | Liability) => {
    const kind = assets.some((a) => a.id === item.id) ? "asset" : "liability";
    setDeleteKind(kind);
    setDeleteTarget(item);
  };

  const handleSaveSuccess = async () => {
    await loadData();
    showSuccess(editItem ? "Updated successfully" : "Added successfully");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const base = deleteKind === "asset" ? "/api/assets" : "/api/liabilities";

    try {
      const response = await fetch(`${base}/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete");
      }

      if (deleteKind === "asset") {
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      } else {
        setLiabilities((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      showSuccess("Deleted");
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const savingsTint =
    computedSummary.monthlySavings >= 0 ? ("success" as const) : ("error" as const);

  return (
    <PageStack>
      <PageHeader
        title="Net Worth"
        description="Track assets, liabilities, monthly net worth, and your savings rate."
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={openAdd}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Add {tab === "assets" ? "Asset" : "Liability"}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} variant="rounded" height={100} />
          ))}
        </ResponsiveColumns>
      ) : (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }}>
          <StatCard
            title="Net worth"
            value={formatCurrency(computedSummary.netWorth)}
            icon={AccountBalanceWalletOutlinedIcon}
            tint="primary"
          />
          <StatCard
            title="Total assets"
            value={formatCurrency(computedSummary.totalAssets)}
            icon={TrendingUpOutlinedIcon}
            tint="success"
          />
          <StatCard
            title="Total liabilities"
            value={formatCurrency(computedSummary.totalLiabilities)}
            icon={TrendingDownOutlinedIcon}
            tint="error"
          />
          <StatCard
            title="Savings rate"
            value={
              computedSummary.savingsRate !== null
                ? formatPercent(computedSummary.savingsRate)
                : "—"
            }
            icon={SavingsOutlinedIcon}
            tint="primary"
          />
        </ResponsiveColumns>
      )}

      {!loading && history.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <NetWorthGrowthChart data={history} />
        </Box>
      )}

      <Tabs
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
        sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}
      >
        <Tab label={`Assets (${assets.length + assetAccounts.length})`} value="assets" />
        <Tab
          label={`Liabilities (${liabilities.length + liabilityAccounts.length})`}
          value="liabilities"
        />
      </Tabs>

      {loading ? (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={180} />
          ))}
        </ResponsiveColumns>
      ) : activeItems.length === 0 && activeAccounts.length === 0 ? (
        <EmptyState
          icon={AccountBalanceWalletOutlinedIcon}
          title={tab === "assets" ? "No assets yet" : "No liabilities yet"}
          description={
            tab === "assets"
              ? "Add cash, investments, property, and other assets to calculate your net worth."
              : "Add loans, credit cards, and other debts you owe."
          }
          actionLabel={tab === "assets" ? "Add Asset" : "Add Liability"}
          onAction={openAdd}
        />
      ) : (
        <>
          {activeAccounts.length > 0 && (
            <SectionPanel>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="subtitle2">From your accounts</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balances update automatically from transactions and transfers.
                  </Typography>
                </Box>
                <Button component={Link} href="/accounts" size="small">
                  Manage
                </Button>
              </Box>
              {activeAccounts.map((account) => (
                <Box
                  key={account.id}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderTop: 1,
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {account.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    color={tab === "assets" ? "success.main" : "error.main"}
                  >
                    {formatCurrency(tab === "assets" ? account.asset : account.liability)}
                  </Typography>
                </Box>
              ))}
            </SectionPanel>
          )}

          {activeItems.length > 0 && (
            <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
              {activeItems.map((item) => (
                <NetWorthItemCard
                  key={item.id}
                  item={item}
                  variant={activeKind}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onMoveToAccounts={
                    // Not when it already looks like an account — moving would duplicate it.
                    suggestAccountTypeForNetWorthItem(activeKind, item.category) &&
                    !findDuplicateAccount(item)
                      ? (target) => setMoveTarget({ kind: activeKind, item: target })
                      : undefined
                  }
                  possibleDuplicateOf={findDuplicateAccount(item)}
                />
              ))}
            </ResponsiveColumns>
          )}
        </>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        Net worth combines your accounts (chequing, savings, investments, credit cards) with the
        items you add here — use this page for things without transactions, like a home, car, or
        mortgage. Savings rate is based on this month&apos;s income and expense transactions.
      </Typography>

      <AssetLiabilityDialog
        kind={dialogKind}
        open={dialogOpen}
        item={editItem}
        onClose={() => {
          setDialogOpen(false);
          setEditItem(null);
        }}
        onSuccess={handleSaveSuccess}
      />

      <MoveToAccountDialog
        target={moveTarget}
        onClose={() => setMoveTarget(null)}
        onSuccess={async () => {
          showSuccess("Moved to Accounts — it now updates with your transactions");
          await loadData();
        }}
      />

      <DeleteNetWorthItemDialog
        kind={deleteKind}
        item={deleteTarget}
        open={!!deleteTarget}
        deleting={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageStack>
  );
}
