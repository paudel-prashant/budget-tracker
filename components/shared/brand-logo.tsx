"use client";

import Image from "next/image";
import { Box, type SxProps, type Theme } from "@mui/material";
import { APP_ICON_PATH, APP_NAME } from "@/lib/config/app";

type BrandLogoProps = {
  size?: number;
  sx?: SxProps<Theme>;
  priority?: boolean;
};

export function BrandLogo({ size = 40, sx, priority = false }: BrandLogoProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        bgcolor: "transparent",
        ...sx,
      }}
    >
      <Image
        src={APP_ICON_PATH}
        alt={`${APP_NAME} logo`}
        width={size}
        height={size}
        priority={priority}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </Box>
  );
}
