import { Typography, Stack, Divider } from "@mui/material";
import { PageHeader } from "@/components/shared/ui/page-header";
import { PageStack } from "@/components/shared/ui/page-stack";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { ImportExportSection } from "@/components/settings/import-export-section";
import { CurrencySettingsSection } from "@/components/settings/currency-settings-section";
import { CARD_PADDING } from "@/lib/config/layout-constants";

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
          <CurrencySettingsSection />
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
