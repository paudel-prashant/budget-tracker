"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Slide,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InstallMobileOutlinedIcon from "@mui/icons-material/InstallMobileOutlined";
import { APP_NAME } from "@/lib/config/app";
import { usePwa } from "@/components/pwa/pwa-provider";
import {
  BOTTOM_NAV_ADD_OVERFLOW,
  BOTTOM_NAV_HEIGHT,
  MOBILE_NAV_BREAKPOINT,
} from "@/lib/config/layout-constants";

export function PwaInstallPrompt() {
  const theme = useTheme();
  const { canInstall, isInstalled, installDismissed, promptInstall, dismissInstall } = usePwa();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(canInstall && !installDismissed);
  }, [canInstall, installDismissed]);

  if (isInstalled || !canInstall || installDismissed) return null;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          bottom: {
            xs: `calc(${BOTTOM_NAV_HEIGHT + BOTTOM_NAV_ADD_OVERFLOW + 16}px + env(safe-area-inset-bottom, 0px))`,
            sm: `calc(${BOTTOM_NAV_HEIGHT + BOTTOM_NAV_ADD_OVERFLOW + 16}px + env(safe-area-inset-bottom, 0px))`,
            [MOBILE_NAV_BREAKPOINT]: 24,
          },
          left: { xs: 16, sm: "auto" },
          right: 16,
          zIndex: theme.zIndex.snackbar,
          maxWidth: { xs: "100%", sm: 400 },
          p: 2,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 55%)`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <InstallMobileOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Install {APP_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add to your home screen for faster access and offline dashboard & transactions.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="contained" onClick={() => void promptInstall()}>
                Install
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  dismissInstall();
                  setVisible(false);
                }}
              >
                Not now
              </Button>
            </Stack>
          </Box>
          <IconButton
            size="small"
            aria-label="Dismiss install prompt"
            onClick={() => {
              dismissInstall();
              setVisible(false);
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Slide>
  );
}
