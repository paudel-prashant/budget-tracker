"use client";

import { useState } from "react";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { Box } from "@mui/material";
import {
  BalanceSummaryDetailDrawer,
  type BalanceSummaryKind,
} from "@/components/dashboard/balance-summary-detail-drawer";
import { StatCard } from "@/components/shared/ui/stat-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StaggeredReveal } from "@/components/shared/ui/staggered-reveal";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardDateRange, Summary } from "@/lib/types";

type SummaryCardsProps = {
  summary: Summary;
  dateRange: DashboardDateRange;
  dimmed?: boolean;
};

const cards: Array<{
  key: BalanceSummaryKind;
  title: string;
  icon: typeof TrendingUpOutlinedIcon;
  tint: "success" | "error" | "primary";
  gradient: string;
  value: (s: Summary) => number;
}> = [
  {
    key: "income",
    title: "Total Income",
    icon: TrendingUpOutlinedIcon,
    tint: "success",
    gradient: "linear-gradient(90deg, #059669, #34d399)",
    value: (s) => s.totalIncome,
  },
  {
    key: "expenses",
    title: "Total Expenses",
    icon: TrendingDownOutlinedIcon,
    tint: "error",
    gradient: "linear-gradient(90deg, #dc2626, #f87171)",
    value: (s) => s.totalExpenses,
  },
  {
    key: "balance",
    title: "Net Balance",
    icon: AccountBalanceOutlinedIcon,
    tint: "primary",
    gradient: "linear-gradient(90deg, #4f46e5, #818cf8)",
    value: (s) => s.netBalance,
  },
];

export function SummaryCards({ summary, dateRange, dimmed = false }: SummaryCardsProps) {
  const [detailKind, setDetailKind] = useState<BalanceSummaryKind | null>(null);

  const cardNodes = cards.map((card) => (
    <StatCard
      key={card.key}
      title={card.title}
      value={formatCurrency(card.value(summary))}
      icon={card.icon}
      tint={card.tint}
      accentGradient={card.gradient}
      disabled={dimmed}
      onClick={() => setDetailKind(card.key)}
    />
  ));

  return (
    <>
      <Box
        sx={{
          opacity: dimmed ? 0.85 : 1,
          transition: "opacity 0.28s ease",
        }}
      >
        <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 3 }} gap={2}>
          <StaggeredReveal staggerMs={60}>{cardNodes}</StaggeredReveal>
        </ResponsiveColumns>
      </Box>

      <BalanceSummaryDetailDrawer
        open={detailKind !== null}
        kind={detailKind}
        summary={summary}
        dateRange={dateRange}
        onClose={() => setDetailKind(null)}
      />
    </>
  );
}
