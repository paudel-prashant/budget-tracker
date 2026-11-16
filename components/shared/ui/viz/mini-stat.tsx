"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

type MiniStatProps = {
  label: string;
  value: string;
  icon?: SvgIconComponent;
  /** Theme colour for the icon only; the value stays in text ink. */
  color?: string;
};

/** Compact label + value pair for hero banners and summary strips. */
export function MiniStat({ label, value, icon: Icon, color = "text.secondary" }: MiniStatProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
      {Icon && <Icon sx={{ fontSize: 18, color, mt: 0.25 }} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }} noWrap>
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}
