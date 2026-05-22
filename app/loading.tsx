import { Box, Skeleton } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { ResponsiveColumns } from "@/components/ui/responsive-columns";

export default function DashboardLoading() {
  return (
    <PageStack>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity and trends."
      />
      <Skeleton variant="rounded" height={88} />
      <ResponsiveColumns columns={{ xs: 1, sm: 2, md: 3 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={108} />
        ))}
      </ResponsiveColumns>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={140} />
      <Box sx={{ display: "none" }} aria-hidden>
        Loading dashboard...
      </Box>
    </PageStack>
  );
}
