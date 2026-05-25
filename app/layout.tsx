import type { Metadata } from "next";
import { MuiProvider } from "@/components/shared/providers/mui-provider";
import { SessionProvider } from "@/components/shared/providers/session-provider";
import { AuthLayout } from "@/components/shared/layout/auth-layout";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config/app";
import { appFont } from "@/lib/theme/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={appFont.variable} suppressHydrationWarning>
      <body className={appFont.className} suppressHydrationWarning>
        <MuiProvider>
          <SessionProvider>
            <AuthLayout>{children}</AuthLayout>
          </SessionProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
