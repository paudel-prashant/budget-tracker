"use client";

import { Stack, type StackProps } from "@mui/material";
import { PAGE_STACK_SPACING } from "@/lib/config/layout-constants";

export { PAGE_STACK_SPACING };

type PageStackProps = StackProps;

export function PageStack({
  children,
  spacing = PAGE_STACK_SPACING,
  sx,
  ...props
}: PageStackProps) {
  return (
    <Stack spacing={spacing} sx={{ width: "100%", ...sx }} {...props}>
      {children}
    </Stack>
  );
}
