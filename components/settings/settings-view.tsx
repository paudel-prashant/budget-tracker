import { Typography, Stack, Divider } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ImportExportSection } from "@/components/settings/import-export-section";
import { CARD_PADDING } from "@/lib/layout-constants";

export function SettingsView() {
  return (
    <PageStack>
      <PageHeader
        title="Settings"
        description="Configure your preferences and manage transaction data."
      />
      <SurfaceCard sx={{ overflow: "hidden" }}>
        <Stack divider={<Divider />}>
          <Stack sx={{ p: CARD_PADDING }} spacing={0.75}>
            <Typography variant="subtitle1">
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the theme toggle in the top navigation bar to switch between light and dark mode.
            </Typography>
          </Stack>
          <ImportExportSection />
          <Stack sx={{ p: CARD_PADDING }} spacing={0.75}>
            <Typography variant="subtitle1">
              Currency
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currency selection will be available in a future update. Exports use USD formatting.
            </Typography>
          </Stack>
          <Stack sx={{ p: CARD_PADDING }} spacing={0.75}>
            <Typography variant="subtitle1">
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email and push notification settings coming soon.
            </Typography>
          </Stack>
        </Stack>
      </SurfaceCard>
    </PageStack>
  );
}
