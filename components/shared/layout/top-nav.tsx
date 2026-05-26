"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_NAME } from "@/lib/config/app";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useThemeMode } from "@/lib/theme/theme-context";
import {
  APP_BAR_HEIGHT,
  DRAWER_WIDTH,
  MOBILE_NAV_BREAKPOINT,
} from "@/lib/config/layout-constants";
import { touchIconButtonSx } from "@/lib/theme/touch-targets";
import { UserMenu } from "@/components/shared/layout/user-menu";

type TopNavProps = {
  drawerWidth?: number;
};

export function TopNav({ drawerWidth = DRAWER_WIDTH }: TopNavProps) {
  const { mode, toggleColorMode } = useThemeMode();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: {
          xs: "100%",
          [MOBILE_NAV_BREAKPOINT]: `calc(100% - ${drawerWidth}px)`,
        },
        ml: { xs: 0, [MOBILE_NAV_BREAKPOINT]: `${drawerWidth}px` },
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${APP_BAR_HEIGHT}px !important`,
          height: APP_BAR_HEIGHT,
          px: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: { xs: "flex", [MOBILE_NAV_BREAKPOINT]: "none" },
            alignItems: "center",
            gap: 1,
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <BrandLogo size={32} priority />
          <Typography variant="subtitle1" component="div" fontWeight={700} noWrap>
            {APP_NAME}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: "none", [MOBILE_NAV_BREAKPOINT]: "block" } }} />
        <UserMenu />
        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton
            onClick={toggleColorMode}
            aria-label="toggle color mode"
            color="inherit"
            sx={{
              ...touchIconButtonSx,
              minWidth: { xs: 44, [MOBILE_NAV_BREAKPOINT]: 40 },
              minHeight: { xs: 44, [MOBILE_NAV_BREAKPOINT]: 40 },
            }}
          >
            {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
