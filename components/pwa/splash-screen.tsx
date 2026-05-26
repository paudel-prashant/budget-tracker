"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, alpha, useTheme } from "@mui/material";
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/config/app";
import { PWA_BACKGROUND_COLOR } from "@/lib/config/pwa";

const SPLASH_SEEN_KEY = "budgetrax-splash-seen";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function SplashScreen() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneDisplay();
    const seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    if (!standalone && seen) return;

    setVisible(true);
    sessionStorage.setItem(SPLASH_SEEN_KEY, "1");

    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={`Loading ${APP_NAME}`}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.tooltip + 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: PWA_BACKGROUND_COLOR,
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${alpha(theme.palette.primary.main, 0.2)}, transparent 60%), ${PWA_BACKGROUND_COLOR}`,
        transition: "opacity 0.35s ease",
      }}
    >
      <BrandLogo
        size={88}
        priority
        sx={{
          borderRadius: 3,
          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      />
      <Box sx={{ textAlign: "center", px: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {APP_NAME}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {APP_TAGLINE}
        </Typography>
      </Box>
      <CircularProgress size={28} thickness={4} />
    </Box>
  );
}
