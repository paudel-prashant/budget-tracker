"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
