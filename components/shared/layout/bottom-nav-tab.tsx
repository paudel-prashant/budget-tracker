"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import Link from "next/link";
import { TOUCH_TARGET_MIN } from "@/lib/config/layout-constants";

type BottomNavTabProps = {
  label: string;
  icon: SvgIconComponent;
  active: boolean;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
};

function TabContent({
  label,
  icon: Icon,
  active,
}: Pick<BottomNavTabProps, "label" | "icon" | "active">) {
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          width: 40,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          transition: "background-color 0.2s ease, color 0.2s ease",
          bgcolor: active ? alpha(theme.palette.primary.main, 0.14) : "transparent",
          color: active ? "primary.main" : "text.secondary",
        }}
      >
        <Icon sx={{ fontSize: active ? 23 : 22 }} />
      </Box>
      <Typography
        variant="caption"
        noWrap
        fontWeight={active ? 600 : undefined}
        sx={{
          lineHeight: 1.15,
          color: active ? "primary.main" : "text.secondary",
          transition: "color 0.2s ease",
          maxWidth: "100%",
        }}
      >
        {label}
      </Typography>
    </>
  );
}

function tabShellSx(active: boolean) {
  return {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 0.25,
    minHeight: TOUCH_TARGET_MIN,
    py: 0.5,
    px: 0.25,
    mx: 0.25,
    borderRadius: 2.5,
    textDecoration: "none",
    border: 0,
    cursor: "pointer",
    font: "inherit",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.15s ease, background-color 0.2s ease",
    "&:active": {
      transform: "scale(0.97)",
    },
    ...(active
      ? {
          bgcolor: (theme: { palette: { primary: { main: string } } }) =>
            alpha(theme.palette.primary.main, 0.06),
        }
      : { bgcolor: "transparent" }),
  };
}

export function BottomNavTab({
  label,
  icon,
  active,
  href,
  onClick,
  ariaLabel,
  ariaExpanded,
}: BottomNavTabProps) {
  if (href) {
    return (
      <Box
        component={Link}
        href={href}
        prefetch={false}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        sx={tabShellSx(active)}
      >
        <TabContent label={label} icon={icon} active={active} />
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-expanded={ariaExpanded}
      sx={tabShellSx(active)}
    >
      <TabContent label={label} icon={icon} active={active} />
    </Box>
  );
}
