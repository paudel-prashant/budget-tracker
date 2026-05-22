"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StatCard } from "@/components/shared/ui/stat-card";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { NetWorthGrowthChart } from "@/components/dashboard/net-worth-growth-chart";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { NetWorthDashboardData } from "@/lib/types";

type NetWorthWidgetProps = {
  data: NetWorthDashboardData;
};

export function NetWorthWidget({ data }: NetWorthWidgetProps) {
  const theme = useTheme();
  const { current } = data;
  const hasEntries = data.assets.length > 0 || data.liabilities.length > 0;
  const savingsTint =
    current.monthlySavings >= 0 ? ("success" as const) : ("error" as const);

  return (
    <Stack spacing={3}>
      <SurfaceCard
        accentColor={theme.palette.primary.main}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 55%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <AccountBalanceWalletOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="overline" color="text.secondary">
                Net worth & savings
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ letterSpacing: "-0.02em" }}>
              {formatCurrency(current.netWorth)}
            </Typography>
            {current.netWorthChangePercent !== null && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                {current.netWorthChangePercent >= 0 ? (
                  <TrendingUpOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />
                ) : (
                  <TrendingDownOutlinedIcon sx={{ fontSize: 16, color: "error.main" }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {current.netWorthChangePercent > 0 ? "+" : ""}
                  {formatPercent(current.netWorthChangePercent)} vs prior month
                </Typography>
              </Stack>
            )}
          </Box>
          <Button
            component={NextLink}
            href="/net-worth"
            variant="outlined"
            endIcon={<ArrowForwardOutlinedIcon />}
            sx={{ alignSelf: { sm: "center" }, flexShrink: 0 }}
          >
            Manage assets
          </Button>
        </Stack>

        <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }}>
          <StatCard
            title="Total assets"
            value={formatCurrency(current.totalAssets)}
            icon={TrendingUpOutlinedIcon}
            tint="success"
          />
          <StatCard
            title="Total liabilities"
            value={formatCurrency(current.totalLiabilities)}
            icon={TrendingDownOutlinedIcon}
            tint="error"
          />
          <StatCard
            title="Monthly savings"
            value={formatCurrency(current.monthlySavings)}
            icon={SavingsOutlinedIcon}
            tint={savingsTint}
          />
          <StatCard
            title="Savings rate"
            value={
              current.savingsRate !== null ? formatPercent(current.savingsRate) : "—"
            }
            icon={SavingsOutlinedIcon}
            tint="primary"
          />
        </ResponsiveColumns>

        {!hasEntries && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Add your assets (cash, investments) and liabilities (loans, cards) to track true
            net worth alongside transaction savings.
          </Typography>
        )}

        {current.savingsRate !== null && current.monthlyIncome > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary">
                Savings rate this month
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {formatPercent(current.savingsRate)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, current.savingsRate))}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            />
          </Box>
        )}
      </SurfaceCard>

      <NetWorthGrowthChart data={data.history} />

      {(data.assets.length > 0 || data.liabilities.length > 0) && (
        <ResponsiveColumns columns={{ xs: 1, md: 2 }}>
          <SurfaceCard sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Top assets
            </Typography>
            <Stack spacing={1}>
              {data.assets.slice(0, 5).map((asset) => (
                <Stack
                  key={asset.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {asset.name}
                    </Typography>
                    <Chip label={asset.category} size="small" variant="outlined" sx={{ mt: 0.25 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {formatCurrency(asset.value)}
                  </Typography>
                </Stack>
              ))}
              {data.assets.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No assets yet
                </Typography>
              )}
            </Stack>
          </SurfaceCard>
          <SurfaceCard sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Top liabilities
            </Typography>
            <Stack spacing={1}>
              {data.liabilities.slice(0, 5).map((liability) => (
                <Stack
                  key={liability.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {liability.name}
                    </Typography>
                    <Chip label={liability.category} size="small" variant="outlined" sx={{ mt: 0.25 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {formatCurrency(liability.value)}
                  </Typography>
                </Stack>
              ))}
              {data.liabilities.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No liabilities yet
                </Typography>
              )}
            </Stack>
          </SurfaceCard>
        </ResponsiveColumns>
      )}
    </Stack>
  );
}
