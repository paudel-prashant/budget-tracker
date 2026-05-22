"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Refetches the dashboard server component when navigating back from another page.
 * Fixes stale RSC payloads from Next.js client-side navigation / prefetch.
 */
export function RefreshDashboardOnReturn() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      previousPath.current = pathname;
      return;
    }

    if (previousPath.current && previousPath.current !== "/") {
      router.refresh();
    }

    previousPath.current = pathname;
  }, [pathname, router]);

  return null;
}
