"use client";

import { useEffect, useState } from "react";

/** False on server and first client render — true after mount (avoids hydration mismatch). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
