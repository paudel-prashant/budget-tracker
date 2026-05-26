"use client";

import type { ReactNode } from "react";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { SplashScreen } from "@/components/pwa/splash-screen";

/** Global PWA context, service worker registration, and launch splash. */
export function PwaRoot({ children }: { children: ReactNode }) {
  return (
    <PwaProvider>
      <RegisterServiceWorker />
      <SplashScreen />
      {children}
    </PwaProvider>
  );
}
