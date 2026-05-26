"use client";

import { Box } from "@mui/material";
import { Children, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type StaggeredRevealProps = {
  children: ReactNode;
  /** Delay between each child (ms). */
  staggerMs?: number;
  className?: string;
};

/** Staggered fade-up for list/grid children on mobile. */
export function StaggeredReveal({
  children,
  staggerMs = 50,
  className = "stagger-reveal-item",
}: StaggeredRevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const items = Children.toArray(children);

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <>
      {items.map((child, index) => (
        <Box
          key={index}
          className={className}
          sx={{ animationDelay: `${index * staggerMs}ms` }}
        >
          {child}
        </Box>
      ))}
    </>
  );
}
