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
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { Asset, Liability, NetWorthDashboardData } from "@/lib/types";
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
        <Tab label={`Assets (${assets.length})`} value="assets" />
        <Tab label={`Liabilities (${liabilities.length})`} value="liabilities" />
      </Tabs>

      {loading ? (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={180} />
          ))}
        </ResponsiveColumns>
      ) : activeItems.length === 0 ? (
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
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {activeItems.map((item) => (
            <NetWorthItemCard
              key={item.id}
              item={item}
              variant={activeKind}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </ResponsiveColumns>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        Savings rate is based on income and expense transactions for the current month. Net worth
        snapshots update when you add or edit assets and liabilities.
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
