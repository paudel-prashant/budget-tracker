import { Grid, Paper, Typography, Box } from "@mui/material";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { formatCurrency } from "@/lib/format";
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
    value: (s: Summary) => s.totalIncome,
  },
  {
    key: "expenses" as const,
    title: "Total Expenses",
    icon: TrendingDownOutlinedIcon,
    color: "error.main",
    value: (s: Summary) => s.totalExpenses,
  },
  {
    key: "balance" as const,
    title: "Net Balance",
    icon: AccountBalanceOutlinedIcon,
    color: "primary.main",
    value: (s: Summary) => s.netBalance,
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <Grid container spacing={3}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Grid key={card.key} item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                border: 1,
                borderColor: "divider",
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Icon sx={{ color: card.color }} />
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(card.value(summary))}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
