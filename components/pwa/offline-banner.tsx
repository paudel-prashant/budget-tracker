"use client";

import { Alert, Button } from "@mui/material";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import { usePwa } from "@/components/pwa/pwa-provider";

type OfflineBannerProps = {
  showingCachedData?: boolean;
};

export function OfflineBanner({ showingCachedData = false }: OfflineBannerProps) {
  const { isOnline } = usePwa();

  if (isOnline && !showingCachedData) return null;

  return (
    <Alert
      severity="warning"
      icon={<CloudOffOutlinedIcon fontSize="small" />}
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        !isOnline ? (
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {!isOnline
        ? "Offline mode — showing your last saved data. Changes sync when you reconnect."
        : "Showing cached data from your last visit. Refresh when you are back online."}
    </Alert>
  );
}
