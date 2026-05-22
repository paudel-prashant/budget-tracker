"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useThemeMode } from "@/lib/theme-context";
import { APP_BAR_HEIGHT, DRAWER_WIDTH } from "@/lib/layout-constants";
import { UserMenu } from "@/components/layout/user-menu";

type TopNavProps = {
  drawerWidth?: number;
  isMobile?: boolean;
  onMenuClick?: () => void;
};

export function TopNav({
  drawerWidth = DRAWER_WIDTH,
  isMobile = false,
  onMenuClick,
}: TopNavProps) {
  const { mode, toggleColorMode } = useThemeMode();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { xs: "100%", sm: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, sm: `${drawerWidth}px` },
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
        {isMobile ? (
          <>
            <IconButton
              edge="start"
              onClick={onMenuClick}
              aria-label="open navigation menu"
              color="inherit"
              sx={{ mr: 0.5 }}
            >
              <MenuOutlinedIcon />
            </IconButton>
            <AccountBalanceWalletOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
            <Typography
              variant="subtitle1"
              component="div"
              fontWeight={700}
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Finance Tracker
            </Typography>
          </>
        ) : (
          <Box sx={{ flexGrow: 1 }} />
        )}
        <UserMenu />
        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton onClick={toggleColorMode} aria-label="toggle color mode" color="inherit">
            {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
