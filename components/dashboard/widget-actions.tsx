"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Link,
  type ButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

const widgetLinkButtonSx: SxProps<Theme> = {
  fontWeight: 600,
  flexShrink: 0,
};

type WidgetLinkButtonProps = {
  href: string;
  children: React.ReactNode;
  showArrow?: boolean;
  sx?: SxProps<Theme>;
} & Pick<ButtonProps, "size" | "variant" | "color" | "fullWidth" | "disabled">;

/** Outlined navigation control used across dashboard widgets. */
export function WidgetLinkButton({
  href,
  children,
  size = "small",
  variant = "outlined",
  color = "primary",
  showArrow = true,
  sx,
  ...rest
}: WidgetLinkButtonProps) {
  return (
    <Button
      component={NextLink}
      href={href}
      size={size}
      variant={variant}
      color={color}
      endIcon={showArrow ? <ArrowForwardOutlinedIcon fontSize="inherit" /> : undefined}
      sx={[widgetLinkButtonSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Button>
  );
}

type WidgetFooterProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/** Divider footer row for widget actions (e.g. “View full …”). */
export function WidgetFooter({ children, sx }: WidgetFooterProps) {
  return (
    <Box
      sx={{
        mt: 2,
        pt: 1.75,
        borderTop: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

type WidgetInlineLinkProps = {
  href: string;
  children: React.ReactNode;
};

/** Inline text link inside widget body copy. */
export function WidgetInlineLink({ href, children }: WidgetInlineLinkProps) {
  return (
    <Link
      component={NextLink}
      href={href}
      variant="body2"
      underline="hover"
      sx={{ fontWeight: 600 }}
    >
      {children}
    </Link>
  );
}
