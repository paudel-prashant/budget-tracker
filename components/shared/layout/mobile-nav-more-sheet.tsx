"use client";

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slide,
  Typography,
} from "@mui/material";
import { MOTION_DURATION_MS, MOTION_EASE_OUT } from "@/lib/theme/motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moreNavItems } from "@/lib/config/navigation";

type MobileNavMoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavMoreSheet({ open, onClose }: MobileNavMoreSheetProps) {
  const pathname = usePathname();

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slots={{ transition: Slide }}
      slotProps={{
        transition: {
          direction: "up",
          timeout: MOTION_DURATION_MS,
          easing: { enter: MOTION_EASE_OUT, exit: MOTION_EASE_OUT },
        },
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
            maxHeight: "70dvh",
          },
        },
      }}
    >
      <Box sx={{ pt: 1.5, px: 2, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: "divider",
            mx: "auto",
            mb: 1.5,
          }}
        />
        <Typography variant="subtitle1" fontWeight={700}>
          More
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {moreNavItems.map((item) => {
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
                onClick={onClose}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  minHeight: 48,
                  mx: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 44, color: isActive ? "primary.main" : "text.secondary" }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
