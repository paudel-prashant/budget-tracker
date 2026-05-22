"use client";

import { Paper, Typography, Box, alpha } from "@mui/material";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";
import { formatCurrency } from "@/lib/format";
import { CARD_SHADOW } from "@/lib/layout-constants";
import type { Summary } from "@/lib/types";

type SummaryCardsProps = {
  summary: Summary;
};

const cards = [
  {
    key: "income" as const,
    title: "Total Income",
    icon: TrendingUpOutlinedIcon,
    color: "success.main",
    tint: "success" as const,
    value: (s: Summary) => s.totalIncome,
  },
  {
    key: "expenses" as const,
    title: "Total Expenses",
    icon: TrendingDownOutlinedIcon,
    color: "error.main",
    tint: "error" as const,
    value: (s: Summary) => s.totalExpenses,
  },
  {
    key: "balance" as const,
    title: "Net Balance",
    icon: AccountBalanceOutlinedIcon,
    color: "primary.main",
    tint: "primary" as const,
    value: (s: Summary) => s.netBalance,
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }} gap={2.5}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Paper
            key={card.key}
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: 1,
              borderColor: "divider",
              height: "100%",
              boxShadow: CARD_SHADOW,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box
                sx={(theme) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette[card.tint].main, 0.12),
                  color: card.color,
                })}
              >
                <Icon sx={{ fontSize: 22 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {card.title}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ pl: 0.5 }}>
              {formatCurrency(card.value(summary))}
            </Typography>
          </Paper>
        );
      })}
    </ResponsiveColumns>
  );
}
