import { Paper, Skeleton } from "@mui/material";
import { PageHeader } from "@/components/shared/ui/page-header";
import { TransactionsTableSkeleton } from "@/components/shared/ui/transactions-table-skeleton";

export default function TransactionsLoading() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="View and manage your income and expenses."
        action={<Skeleton variant="rounded" width={160} height={40} />}
      />
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <TransactionsTableSkeleton />
      </Paper>
    </>
  );
}
