import { Box, Grid, Skeleton } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial activity and trends."
      />
      <Grid container spacing={3}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Grid key={index} item xs={12} sm={6} md={4}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rounded" height={360} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rounded" height={360} />
        </Grid>
      </Grid>
      <Box sx={{ display: "none" }} aria-hidden>
        Loading dashboard...
      </Box>
    </>
  );
}
