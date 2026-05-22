"use client";

import { Box, Button, Typography, alpha, useTheme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

type EmptyStateProps = {
  icon: SvgIconComponent;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        px: { xs: 2.5, sm: 4 },
        py: { xs: 6, sm: 8 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: "50%",
          mb: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        }}
      >
        <Icon sx={{ fontSize: 34, color: "primary.main" }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: actionLabel ? 3.5 : 0 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" size="large" onClick={onAction} sx={{ borderRadius: 2.5, px: 3 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
