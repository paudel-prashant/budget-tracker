"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import {
  DASHBOARD_WIDGET_IDS,
  DASHBOARD_WIDGET_META,
  createDefaultDashboardLayout,
  setWidgetVisibility,
  type DashboardLayoutPreferences,
  type DashboardWidgetId,
} from "@/lib/domain/dashboard-layout";

type DashboardCustomizeDialogProps = {
  open: boolean;
  layout: DashboardLayoutPreferences;
  onClose: () => void;
  onChange: (layout: DashboardLayoutPreferences) => void;
};

export function DashboardCustomizeDialog({
  open,
  layout,
  onClose,
  onChange,
}: DashboardCustomizeDialogProps) {
  const visibleCount = layout.widgets.filter((w) => w.visible).length;

  const handleToggle = (id: DashboardWidgetId, checked: boolean) => {
    if (!checked && visibleCount <= 1) return;
    onChange(setWidgetVisibility(layout, id, checked));
  };

  const handleReset = () => {
    onChange(createDefaultDashboardLayout());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Customize dashboard</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose which widgets to show. Drag widgets on the dashboard to reorder them.
        </Typography>
        <FormGroup>
          {DASHBOARD_WIDGET_IDS.map((id) => {
            const widget = layout.widgets.find((w) => w.id === id);
            const meta = DASHBOARD_WIDGET_META[id];
            const checked = widget?.visible ?? true;
            const disableOff = checked && visibleCount <= 1;

            return (
              <FormControlLabel
                key={id}
                control={
                  <Checkbox
                    checked={checked}
                    disabled={disableOff}
                    onChange={(_, next) => handleToggle(id, next)}
                  />
                }
                label={
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={600}>
                      {meta.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {meta.description}
                    </Typography>
                  </Stack>
                }
                sx={{ alignItems: "flex-start", ml: 0, mb: 1.5 }}
              />
            );
          })}
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Button onClick={handleReset} color="inherit">
          Reset layout
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
