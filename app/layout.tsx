import type { Metadata } from "next";
import { MuiProvider } from "@/components/providers/mui-provider";
import { AppShell } from "@/components/layout/app-shell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your finances with a clean, modern dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MuiProvider>
          <AppShell>{children}</AppShell>
        </MuiProvider>
      </body>
    </html>
  );
}
