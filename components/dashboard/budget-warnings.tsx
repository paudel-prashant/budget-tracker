import NextLink from "next/link";
import { Alert, AlertTitle, Box, Button, Stack, Typography } from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { formatCurrency, formatMonthYear } from "@/lib/utils/format";
import type { BudgetWithProgress } from "@/lib/types";

type BudgetWarningsProps = {
  warnings: BudgetWithProgress[];
  month: number;
  year: number;
};

export function BudgetWarnings({ warnings, month, year }: BudgetWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={1.5}>
        <Alert
          severity="error"
          icon={<WarningAmberOutlinedIcon />}
          action={
            <Button component={NextLink} href="/budget" color="inherit" size="small">
              View budgets
            </Button>
          }
        >
          <AlertTitle>
            {warnings.length === 1
              ? "Budget exceeded"
              : `${warnings.length} budgets exceeded`}
          </AlertTitle>
          <Typography variant="body2" component="div">
            Spending in {formatMonthYear(month, year)} has passed the limit for:
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
            {warnings.map((budget) => (
              <Typography key={budget.id} component="li" variant="body2">
                <strong>{budget.category}</strong> — spent {formatCurrency(budget.spent)} of{" "}
                {formatCurrency(budget.monthlyLimit)} (
                {formatCurrency(Math.abs(budget.remaining))} over)
              </Typography>
            ))}
          </Box>
        </Alert>
      </Stack>
    </Box>
  );
}
