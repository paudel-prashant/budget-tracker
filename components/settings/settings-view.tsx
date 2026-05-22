import { Paper, Typography, Stack, Divider } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";
import { PageStack } from "@/components/ui/page-stack";
import { ImportExportSection } from "@/components/settings/import-export-section";

export function SettingsView() {
  return (
    <PageStack>
      <PageHeader
        title="Settings"
        description="Configure your preferences and manage transaction data."
      />
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
        <Stack divider={<Divider />}>
          <Stack sx={{ p: 3 }} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the theme toggle in the top navigation bar to switch between light and dark mode.
            </Typography>
          </Stack>
          <ImportExportSection />
          <Stack sx={{ p: 3 }} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Currency
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currency selection will be available in a future update. Exports use USD formatting.
            </Typography>
          </Stack>
          <Stack sx={{ p: 3 }} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email and push notification settings coming soon.
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </PageStack>
  );
}
