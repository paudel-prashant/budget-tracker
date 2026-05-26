"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

export function UserMenu() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!session?.user) {
    return null;
  }

  const { name, email, image } = session.user;
  const displayName = name ?? email ?? "Account";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <Tooltip title="Account menu">
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label="open account menu"
          aria-controls={open ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          size="small"
          sx={{ ml: 0.5 }}
        >
          <Avatar
            src={image ?? undefined}
            alt={displayName}
            sx={{ width: 34, height: 34, fontSize: 14 }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { minWidth: 220, mt: 1 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {displayName}
          </Typography>
          {email ? (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {email}
            </Typography>
          ) : null}
        </Box>
        <Divider />
        <MenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          sx={{ py: 1.25 }}
        >
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
