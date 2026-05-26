"use client";

import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { StatCard } from "@/components/shared/ui/stat-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";
import { StaggeredReveal } from "@/components/shared/ui/staggered-reveal";
import { formatCurrency } from "@/lib/utils/format";
import type { Summary } from "@/lib/types";

type SummaryCardsProps = {
  summary: Summary;
};

const cards = [
  {
    key: "income" as const,
    title: "Total Income",
    icon: TrendingUpOutlinedIcon,
    tint: "success" as const,
    gradient: "linear-gradient(90deg, #059669, #34d399)",
    value: (s: Summary) => s.totalIncome,
  },
  {
    key: "expenses" as const,
    title: "Total Expenses",
    icon: TrendingDownOutlinedIcon,
    tint: "error" as const,
    gradient: "linear-gradient(90deg, #dc2626, #f87171)",
    value: (s: Summary) => s.totalExpenses,
  },
  {
    key: "balance" as const,
    title: "Net Balance",
    icon: AccountBalanceOutlinedIcon,
    tint: "primary" as const,
    gradient: "linear-gradient(90deg, #4f46e5, #818cf8)",
    value: (s: Summary) => s.netBalance,
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cardNodes = cards.map((card) => (
    <StatCard
      key={card.key}
      title={card.title}
      value={formatCurrency(card.value(summary))}
      icon={card.icon}
      tint={card.tint}
      accentGradient={card.gradient}
    />
  ));

  return (
    <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 3 }} gap={2}>
      <StaggeredReveal staggerMs={60}>{cardNodes}</StaggeredReveal>
    </ResponsiveColumns>
  );
}
