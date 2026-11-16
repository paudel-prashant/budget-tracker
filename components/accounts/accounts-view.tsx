"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { AccountFormDialog, ACCOUNT_TYPE_LABELS } from "@/components/accounts/account-form-dialog";
import { TransferFormDialog } from "@/components/accounts/transfer-form-dialog";
import { UpdateBalanceDialog } from "@/components/accounts/update-balance-dialog";
import { UtilizationMeter } from "@/components/accounts/utilization-meter";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { CategoryIcon } from "@/components/shared/ui/category-icon";
import { HeroBanner } from "@/components/shared/ui/viz/hero-banner";
import { MiniStat } from "@/components/shared/ui/viz/mini-stat";
import { SegmentedBar, foldToTop } from "@/components/shared/ui/viz/segmented-bar";
import { getCategoricalPalette, getOtherColor } from "@/lib/theme/chart-styles";
import { playfulCardSx } from "@/lib/theme/playful";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import { alpha, useTheme } from "@mui/material";
import { getCategoryAppearance } from "@/lib/domain/category-appearance";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { FinanceAccountSummary, Transfer } from "@/lib/types";

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function AccountsView() {
  const { showSuccess, showError } = useSnackbar();
  const [accounts, setAccounts] = useState<FinanceAccountSummary[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FinanceAccountSummary | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string; amount: number } | null>(
    null
  );
  const [balanceTarget, setBalanceTarget] = useState<FinanceAccountSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [accountsResponse, transfersResponse] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/transfers"),
      ]);
      if (!accountsResponse.ok) {
        throw new Error(await readError(accountsResponse, "Failed to load accounts"));
      }
      if (!transfersResponse.ok) {
        throw new Error(await readError(transfersResponse, "Failed to load transfers"));
      }
      setAccounts(((await accountsResponse.json()) as { accounts: FinanceAccountSummary[] }).accounts);
      setTransfers(((await transfersResponse.json()) as { transfers: Transfer[] }).transfers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const theme = useTheme();
  const palette = getCategoricalPalette(theme);
  const cashOnHand = accounts
    .filter((a) => a.type !== "INVESTMENT" && a.type !== "CREDIT")
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const invested = accounts
    .filter((a) => a.type === "INVESTMENT")
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const creditOwed = accounts
    .filter((a) => a.type === "CREDIT")
    .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);
  // Colour slot follows each account's position in the (stable) account list, not its size.
  const balanceSegments = foldToTop(
    accounts
      .map((account, index) => ({
        key: account.id,
        label: account.name,
        value: account.currentBalance,
        // Never cycle hues: accounts past the sixth share the muted "other" colour.
        color: index < palette.length ? palette[index] : getOtherColor(theme),
      }))
      .filter((segment) => segment.value > 0),
    6,
    (value, count) => ({
      key: "other",
      label: `${count} other accounts`,
      value,
      color: getOtherColor(theme),
    })
  );

  const deleteAccount = async (account: FinanceAccountSummary) => {
    if (!window.confirm(`Delete "${account.name}"? This can't be undone.`)) return;
    setBusyId(account.id);
    try {
      const response = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response, "Failed to delete account"));
      showSuccess("Account deleted");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setBusyId(null);
    }
  };

  const deleteTransfer = async (transfer: Transfer) => {
    setBusyId(transfer.id);
    try {
      const response = await fetch(`/api/transfers/${transfer.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response, "Failed to delete transfer"));
      showSuccess("Transfer deleted");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete transfer");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageStack>
      <PageHeader
        title="Accounts"
        description="Chequing, savings, credit cards and investments, all in one place."
        action={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>
            <Button
              variant="outlined"
              startIcon={<SwapHorizOutlinedIcon />}
              disabled={accounts.length < 2}
              onClick={() => {
                setTransferPrefill(null);
                setTransferDialogOpen(true);
              }}
            >
              Transfer
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => {
                setEditTarget(null);
                setAccountDialogOpen(true);
              }}
            >
              Add account
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={200} />
      ) : (
        <HeroBanner
          eyebrow={`Combined balance · ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
          icon={AccountBalanceOutlinedIcon}
          tone={totalBalance >= 0 ? "primary" : "error"}
          value={totalBalance}
          format={formatCurrency}
          caption={
            creditOwed > 0
              ? `Includes ${formatCurrency(creditOwed)} owed on credit cards`
              : "No credit card debt. Nice 👏"
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
              mb: balanceSegments.length > 1 ? 2.5 : 0,
            }}
          >
            <MiniStat icon={PaymentsOutlinedIcon} label="Cash on hand" value={formatCurrency(cashOnHand)} color="success.main" />
            <MiniStat icon={ShowChartOutlinedIcon} label="Invested" value={formatCurrency(invested)} color="info.main" />
            <MiniStat icon={CreditCardOutlinedIcon} label="Credit owed" value={formatCurrency(creditOwed)} color="error.main" />
          </Box>
          {balanceSegments.length > 1 && (
            <SegmentedBar segments={balanceSegments} format={formatCurrency} legend="inline" height={12} />
          )}
        </HeroBanner>
      )}

      {loading ? (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={140} />
          ))}
        </ResponsiveColumns>
      ) : (
        <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
          {accounts.map((account) => (
            <SurfaceCard
              key={account.id}
              sx={{
                p: CARD_PADDING,
                ...playfulCardSx(
                  getCategoryAppearance(ACCOUNT_TYPE_LABELS[account.type]).color,
                  theme.palette.mode === "dark"
                ),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  {account.type === "CREDIT" ? (
                    <MiniCardArt color={getCategoryAppearance("Credit card").color} />
                  ) : (
                    <CategoryIcon category={ACCOUNT_TYPE_LABELS[account.type]} size="large" />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {account.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </Typography>
                      {account.isPrimary && (
                        <Chip label="Primary" size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />
                      )}
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction="row">
                  <Tooltip title={account.type === "INVESTMENT" ? "Update market value" : "Update balance"}>
                    <IconButton
                      aria-label={`Update balance of ${account.name}`}
                      onClick={() => setBalanceTarget(account)}
                    >
                      <TuneOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit account">
                    <IconButton
                      aria-label={`Edit ${account.name}`}
                      onClick={() => {
                        setEditTarget(account);
                        setAccountDialogOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!account.isPrimary && (
                    <Tooltip title="Delete account">
                      <span>
                        <IconButton
                          aria-label={`Delete ${account.name}`}
                          disabled={busyId === account.id}
                          onClick={() => void deleteAccount(account)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
              {account.type === "CREDIT" ? (
                <CreditCardDetails
                  account={account}
                  onPay={(owed) => {
                    setTransferPrefill({ toAccountId: account.id, amount: owed });
                    setTransferDialogOpen(true);
                  }}
                  canPay={accounts.length > 1}
                />
              ) : (
                <>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ mt: 2.5, letterSpacing: "-0.02em" }}
                    color={account.currentBalance < 0 ? "error.main" : "text.primary"}
                  >
                    {formatCurrency(account.currentBalance)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {account.transactionCount}{" "}
                    {account.transactionCount === 1 ? "transaction" : "transactions"}
                    {totalBalance > 0 && account.currentBalance > 0
                      ? ` · ${Math.round((account.currentBalance / totalBalance) * 100)}% of your money`
                      : ""}
                  </Typography>
                </>
              )}
            </SurfaceCard>
          ))}
        </ResponsiveColumns>
      )}

      {!loading && accounts.length < 2 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Add a savings account or credit card to record transfers between accounts — moving
          money or paying off a card won&apos;t count as spending.
        </Typography>
      )}

      {!loading && transfers.length > 0 && (
        <SectionPanel sx={{ mt: 3 }}>
          <Box sx={{ p: CARD_PADDING }}>
            <Typography variant="h6">Recent transfers</Typography>
          </Box>
          <Divider />
          {transfers.map((transfer, index) => (
            <Box key={transfer.id}>
              {index > 0 && <Divider />}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ px: CARD_PADDING, py: 1.5 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "primary.main",
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  }}
                >
                  <SwapHorizOutlinedIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {accountNames.get(transfer.fromAccountId) ?? "Deleted account"}
                    </Typography>
                    <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {accountNames.get(transfer.toAccountId) ?? "Deleted account"}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {formatDate(transfer.date)}
                    {transfer.note ? ` · ${transfer.note}` : ""}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {formatCurrency(transfer.amount)}
                </Typography>
                <Tooltip title="Delete transfer">
                  <span>
                    <IconButton
                      aria-label="Delete transfer"
                      disabled={busyId === transfer.id}
                      onClick={() => void deleteTransfer(transfer)}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </SectionPanel>
      )}

      <AccountFormDialog
        open={accountDialogOpen}
        account={editTarget}
        onClose={() => {
          setAccountDialogOpen(false);
          setEditTarget(null);
        }}
        onSuccess={async () => {
          showSuccess(editTarget ? "Account updated" : "Account added");
          await load();
        }}
      />

      <UpdateBalanceDialog
        account={balanceTarget}
        onClose={() => setBalanceTarget(null)}
        onSuccess={async () => {
          showSuccess("Balance updated");
          await load();
        }}
      />

      <TransferFormDialog
        open={transferDialogOpen}
        accounts={accounts}
        prefill={transferPrefill}
        onClose={() => setTransferDialogOpen(false)}
        onSuccess={async () => {
          showSuccess("Transfer recorded");
          await load();
        }}
      />
    </PageStack>
  );
}

function CreditCardDetails({
  account,
  onPay,
  canPay,
}: {
  account: FinanceAccountSummary;
  onPay: (owed: number) => void;
  canPay: boolean;
}) {
  const owed = Math.max(0, -account.currentBalance);
  const limit = account.creditLimit;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="caption" color="text.secondary">
            {account.currentBalance > 0 ? "Credit balance" : "Owed"}
          </Typography>
          <Typography variant="h5">
            {formatCurrency(account.currentBalance > 0 ? account.currentBalance : owed)}
          </Typography>
        </Box>
        {owed > 0 && canPay && (
          <Button size="small" variant="outlined" onClick={() => onPay(owed)}>
            Pay
          </Button>
        )}
      </Stack>
      {limit ? (
        <Box sx={{ mt: 1 }}>
          <UtilizationMeter
            owed={owed}
            creditLimit={limit}
            utilization={Math.round((owed / limit) * 1000) / 10}
          />
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Add a credit limit (edit) to track utilization.
        </Typography>
      )}
    </Box>
  );
}

/** A tiny credit card illustration for credit accounts. */
function MiniCardArt({ color }: { color: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 52,
        height: 36,
        flexShrink: 0,
        borderRadius: 1.25,
        position: "relative",
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.55)} 100%)`,
        boxShadow: `0 6px 14px -6px ${alpha(color, 0.7)}`,
        transform: "rotate(-6deg)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 7,
          top: 9,
          width: 11,
          height: 8,
          borderRadius: 0.5,
          bgcolor: "rgba(255, 215, 120, 0.95)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 7,
          right: 7,
          bottom: 7,
          height: 3,
          borderRadius: 1,
          bgcolor: "rgba(255, 255, 255, 0.6)",
        }}
      />
    </Box>
  );
}
