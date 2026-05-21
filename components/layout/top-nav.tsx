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

const DRAWER_WIDTH = 260;

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
      sx={{
        width: { xs: "100%", sm: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, sm: `${drawerWidth}px` },
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            aria-label="open navigation menu"
            color="inherit"
          >
            <MenuOutlinedIcon />
          </IconButton>
        )}
        <AccountBalanceWalletOutlinedIcon color="primary" />
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            fontSize: { xs: "1rem", sm: "1.125rem" },
          }}
          noWrap
        >
          Finance Tracker
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            <IconButton onClick={toggleColorMode} aria-label="toggle color mode" color="inherit">
              {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
