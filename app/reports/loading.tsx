import { Box, Skeleton, Stack } from "@mui/material";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { ResponsiveColumns } from "@/components/shared/ui/responsive-columns";

export default function ReportsLoading() {
  return (
    <PageStack>
      <PageHeader
        title="Monthly Reports"
        description="Professional summaries of income, spending, savings, and category trends."
      />
      <SurfaceCard sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={88} sx={{ mb: 3 }} />
        <ResponsiveColumns columns={{ xs: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} variant="rounded" height={120} />
          ))}
        </ResponsiveColumns>
        <Stack spacing={2} sx={{ mt: 3 }}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={320} />
        </Stack>
      </SurfaceCard>
    </PageStack>
  );
}
