"use client";

import { SurfaceCard } from "@/components/ui/surface-card";
import type { PaperProps } from "@mui/material";

export function SectionPanel({ children, sx, ...props }: PaperProps) {
  return (
    <SurfaceCard
      {...props}
      sx={[
        {
          overflow: "hidden",
          width: "100%",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </SurfaceCard>
  );
}
