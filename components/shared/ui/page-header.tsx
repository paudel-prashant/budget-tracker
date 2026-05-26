"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import { pageDescriptionSx, pageTitleSx } from "@/lib/theme/typography";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "flex-start" },
        justifyContent: "space-between",
        gap: 2.5,
        pb: 0.5,
        mb: 0.5,
      }}
    >
      <Box sx={{ minWidth: 0, position: "relative", pl: { xs: 0, sm: 2.25 } }}>
        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 4,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.35)})`,
          }}
        />
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: description ? 1 : 0,
            ...pageTitleSx,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 560, ...pageDescriptionSx }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" }, pt: { sm: 0.25 } }}>{action}</Box>
      )}
    </Box>
  );
}
