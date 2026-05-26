"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getNavRouteIndex } from "@/lib/config/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type PageTransitionProps = {
  children: ReactNode;
};

type MotionClass = "page-transition-enter" | "page-transition-forward" | "page-transition-back";

/** Direction-aware fade/slide when navigating between app routes. */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const prevIndexRef = useRef(getNavRouteIndex(pathname));
  const [motionClass, setMotionClass] = useState<MotionClass>("page-transition-enter");

  useEffect(() => {
    const prevIndex = prevIndexRef.current;
    const nextIndex = getNavRouteIndex(pathname);

    if (nextIndex > prevIndex) {
      setMotionClass("page-transition-forward");
    } else if (nextIndex < prevIndex) {
      setMotionClass("page-transition-back");
    } else {
      setMotionClass("page-transition-enter");
    }

    prevIndexRef.current = nextIndex;
  }, [pathname]);

  const className = reducedMotion ? undefined : motionClass;

  return (
    <Box
      key={pathname}
      className={className}
      sx={{
        width: "100%",
        minWidth: 0,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {children}
    </Box>
  );
}
