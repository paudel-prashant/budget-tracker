"use client";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  alpha,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { mainNavItems } from "@/lib/navigation";
import { APP_BAR_HEIGHT, DRAWER_WIDTH } from "@/lib/layout-constants";

export { DRAWER_WIDTH };

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarBrand() {
  return (
    <Box
      sx={{
        height: APP_BAR_HEIGHT,
        px: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        flexShrink: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        <AccountBalanceWalletOutlinedIcon fontSize="small" />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} noWrap>
        Finance Tracker
      </Typography>
    </Box>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
      {mainNavItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              prefetch={false}
              selected={isActive}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                py: 1,
                px: 1.5,
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? "primary.main" : "text.secondary",
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SidebarBrand />
      <NavList onNavigate={onNavigate} />
    </Box>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const drawerPaperSx = {
    boxSizing: "border-box",
    width: DRAWER_WIDTH,
    bgcolor: "background.paper",
    borderRight: 1,
    borderColor: "divider",
  };

  return (
    <Box
      component="nav"
      sx={{
        width: { xs: 0, sm: DRAWER_WIDTH },
        flexShrink: 0,
        overflow: { xs: "hidden", sm: "visible" },
      }}
      aria-label="main navigation"
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        <DrawerContent onNavigate={onMobileClose} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
        open
      >
        <DrawerContent />
      </Drawer>
    </Box>
  );
}
