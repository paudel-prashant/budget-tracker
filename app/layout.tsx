import type { Metadata } from "next";
import { MuiProvider } from "@/components/providers/mui-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthLayout } from "@/components/layout/auth-layout";
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
          <SessionProvider>
            <AuthLayout>{children}</AuthLayout>
          </SessionProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
