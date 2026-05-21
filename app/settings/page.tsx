import { Paper, Typography, Stack, Divider } from "@mui/material";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your preferences and account options."
      />
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <Stack divider={<Divider />}>
          <Stack sx={{ p: 3 }} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the theme toggle in the top navigation bar to switch between light and dark mode.
            </Typography>
          </Stack>
          <Stack sx={{ p: 3 }} spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              Currency
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currency selection will be available after backend integration.
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
    </>
  );
}
