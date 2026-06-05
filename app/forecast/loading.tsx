import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { Box, Skeleton, Stack } from "@mui/material";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SectionPanel } from "@/components/shared/ui/section-panel";
import { CARD_PADDING } from "@/lib/config/layout-constants";

export default function ForecastLoading() {
  return (
    <PageStack>
      <PageHeader
        title="Cash Flow Forecast"
        description="Project future balances using your transaction history, recurring items, and spending trends."
      />
      <SectionPanel sx={{ p: CARD_PADDING }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="rounded" width={280} height={36} />
          </Box>
          <Stack direction="row" spacing={2}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} variant="rounded" height={120} sx={{ flex: 1 }} />
            ))}
          </Stack>
          <Skeleton variant="rounded" height={320} />
          <Stack direction="row" spacing={1} alignItems="center">
            <TimelineOutlinedIcon color="disabled" />
            <Skeleton variant="text" width="60%" />
          </Stack>
        </Stack>
      </SectionPanel>
    </PageStack>
  );
}
