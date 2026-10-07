"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { CARD_PADDING } from "@/lib/config/layout-constants";

type BudgetSettings = {
  budgetCarryOverEnabled: boolean;
  budgetAlertsEnabled: boolean;
  pushConfigured: boolean;
};

type DeviceStatus = "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** VAPID keys are base64url; PushManager.subscribe wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  // The service worker is only registered in production builds (register-service-worker.tsx).
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function BudgetNotificationsSection() {
  const { showSuccess, showError } = useSnackbar();
  const [settings, setSettings] = useState<BudgetSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<DeviceStatus>("checking");
  const [deviceBusy, setDeviceBusy] = useState(false);

  const refreshDeviceStatus = useCallback(async () => {
    if (!pushSupported()) {
      setDevice("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setDevice("denied");
      return;
    }
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    setDevice(subscription ? "subscribed" : "unsubscribed");
  }, []);

  useEffect(() => {
    fetch("/api/settings/budgets")
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response, "Failed to load settings"));
        setSettings((await response.json()) as BudgetSettings);
      })
      .catch((err: unknown) =>
        showError(err instanceof Error ? err.message : "Failed to load settings")
      );
    void refreshDeviceStatus();
  }, [refreshDeviceStatus, showError]);

  const updateSetting = async (patch: Partial<Omit<BudgetSettings, "pushConfigured">>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/budgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to save settings"));
      setSettings((await response.json()) as BudgetSettings);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const enableOnDevice = async () => {
    setDeviceBusy(true);
    try {
      const registration = await getRegistration();
      if (!registration) {
        throw new Error("Notifications need the installed app (production build) to be running.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        await refreshDeviceStatus();
        throw new Error("Notification permission was not granted.");
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to enable notifications"));

      setDevice("subscribed");
      showSuccess("Notifications enabled on this device");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setDeviceBusy(false);
    }
  };

  const disableOnDevice = async () => {
    setDeviceBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setDevice("unsubscribed");
      showSuccess("Notifications turned off on this device");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to turn off notifications");
    } finally {
      setDeviceBusy(false);
    }
  };

  const sendTest = async () => {
    setDeviceBusy(true);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      if (!response.ok) throw new Error(await readError(response, "Failed to send test"));
      showSuccess("Test notification sent");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to send test");
    } finally {
      setDeviceBusy(false);
    }
  };

  const pushAvailable = Boolean(settings?.pushConfigured && VAPID_PUBLIC_KEY);

  return (
    <Stack sx={{ p: CARD_PADDING }} spacing={1.5}>
      <Typography variant="subtitle1">Budgets &amp; notifications</Typography>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings?.budgetCarryOverEnabled ?? false}
              disabled={!settings || saving}
              onChange={(event) =>
                void updateSetting({ budgetCarryOverEnabled: event.target.checked })
              }
            />
          }
          label="Start each month with last month's budgets"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 6, mt: -0.5 }}>
          When a new month begins with no budgets, your most recent budgets are copied over
          automatically. Edit or delete them any time.
        </Typography>
      </Box>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings?.budgetAlertsEnabled ?? false}
              disabled={!settings || saving}
              onChange={(event) => void updateSetting({ budgetAlertsEnabled: event.target.checked })}
            />
          }
          label="Budget alerts"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 6, mt: -0.5 }}>
          A push notification when a budget reaches 80% and again if it goes over.
        </Typography>
      </Box>

      {settings && !pushAvailable && (
        <Alert severity="info" variant="outlined">
          Push notifications aren&apos;t configured on this server yet (VAPID keys missing).
        </Alert>
      )}

      {settings && pushAvailable && settings.budgetAlertsEnabled && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          {device === "unsupported" && (
            <Typography variant="body2" color="text.secondary">
              This browser doesn&apos;t support push notifications. On iPhone, add Budgetrax to
              your Home Screen first.
            </Typography>
          )}
          {device === "denied" && (
            <Typography variant="body2" color="text.secondary">
              Notifications are blocked for this site. Allow them in your browser settings to
              receive alerts.
            </Typography>
          )}
          {device === "unsubscribed" && (
            <Button variant="contained" size="small" disabled={deviceBusy} onClick={enableOnDevice}>
              Enable on this device
            </Button>
          )}
          {device === "subscribed" && (
            <>
              <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                Alerts are on for this device.
              </Typography>
              <Button size="small" variant="outlined" disabled={deviceBusy} onClick={sendTest}>
                Send test
              </Button>
              <Button size="small" disabled={deviceBusy} onClick={disableOnDevice}>
                Turn off on this device
              </Button>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}
