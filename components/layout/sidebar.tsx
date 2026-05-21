"use client";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/lib/navigation";

export const DRAWER_WIDTH = 260;

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <List sx={{ px: 1, flex: 1 }}>
      {mainNavItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isActive}
              onClick={onNavigate}
              sx={{
                "&.Mui-selected": {
                  bgcolor:
                    theme.palette.mode === "light"
                      ? "primary.main"
                      : "action.selected",
                  color:
                    theme.palette.mode === "light"
                      ? "primary.contrastText"
                      : "primary.main",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "primary.dark"
                        : "action.selected",
                  },
                  "& .MuiListItemIcon-root": {
                    color:
                      theme.palette.mode === "light"
                        ? "primary.contrastText"
                        : "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color:
                    isActive && theme.palette.mode === "light"
                      ? "inherit"
                      : "text.secondary",
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 400,
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
      <Toolbar sx={{ px: 2.5 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Menu
        </Typography>
      </Toolbar>
      <NavList onNavigate={onNavigate} />
    </Box>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      aria-label="main navigation"
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            bgcolor: "background.paper",
          },
        }}
      >
        <DrawerContent onNavigate={onMobileClose} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            bgcolor: "background.paper",
          },
        }}
        open
      >
        <DrawerContent />
      </Drawer>
    </Box>
  );
}
