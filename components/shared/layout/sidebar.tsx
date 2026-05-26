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
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/config/app";
import { brandTitleSx } from "@/lib/theme/typography";
import { mainNavItems } from "@/lib/config/navigation";
import {
  APP_BAR_HEIGHT,
  DRAWER_WIDTH,
  MOBILE_NAV_BREAKPOINT,
} from "@/lib/config/layout-constants";

export { DRAWER_WIDTH };

function SidebarBrand() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: APP_BAR_HEIGHT,
        px: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexShrink: 0,
        borderBottom: 1,
        borderColor: "divider",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
      }}
    >
      <BrandLogo size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" noWrap sx={brandTitleSx}>
          {APP_NAME}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {APP_TAGLINE}
        </Typography>
      </Box>
    </Box>
  );
}

function NavList() {
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <List sx={{ px: 1.5, py: 2, flex: 1 }}>
      {mainNavItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              prefetch={false}
              selected={isActive}
              sx={{
                borderRadius: 2.5,
                py: 1.15,
                px: 1.75,
                minHeight: 44,
                position: "relative",
                overflow: "hidden",
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                  },
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
                "&:hover": {
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: isActive ? "primary.main" : "text.secondary",
                }}
              >
                <Icon sx={{ fontSize: 21 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: "body2",
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

export function Sidebar() {
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
        width: { xs: 0, [MOBILE_NAV_BREAKPOINT]: DRAWER_WIDTH },
        flexShrink: 0,
        display: { xs: "none", [MOBILE_NAV_BREAKPOINT]: "block" },
      }}
      aria-label="main navigation"
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", [MOBILE_NAV_BREAKPOINT]: "block" },
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
        open
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <SidebarBrand />
          <NavList />
        </Box>
      </Drawer>
    </Box>
  );
}
