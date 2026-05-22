"use client";

import { Box, Dialog, DialogTitle, Typography, type DialogProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type DialogShellProps = DialogProps & {
  title: string;
  subtitle?: string;
};

export function DialogShell({ title, subtitle, children, sx, ...props }: DialogShellProps) {
  const theme = useTheme();

  return (
    <Dialog
      {...props}
      scroll="paper"
      sx={[
        {
          "& .MuiDialog-paper": {
            m: { xs: 2, sm: 3 },
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            boxShadow:
              theme.palette.mode === "light"
                ? "0 24px 48px rgba(15, 23, 42, 0.14)"
                : "0 24px 48px rgba(0, 0, 0, 0.5)",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          pt: 3,
          pb: subtitle ? 2 : 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 55%)`,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <DialogTitle sx={{ p: 0 }}>{title}</DialogTitle>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Dialog>
  );
}
