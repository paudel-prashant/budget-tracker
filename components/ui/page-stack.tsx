"use client";

import { Stack, type StackProps } from "@mui/material";

export const PAGE_STACK_SPACING = 2.5;

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
