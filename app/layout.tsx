import type { Metadata, Viewport } from "next";
import { MuiProvider } from "@/components/shared/providers/mui-provider";
import { SessionProvider } from "@/components/shared/providers/session-provider";
import { AuthLayout } from "@/components/shared/layout/auth-layout";
import { PwaRoot } from "@/components/pwa/pwa-root";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config/app";
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from "@/lib/config/pwa";
import { appFont } from "@/lib/theme/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={appFont.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body
        className={appFont.className}
        suppressHydrationWarning
        style={{ backgroundColor: PWA_BACKGROUND_COLOR }}
      >
        <MuiProvider>
          <SessionProvider>
            <PwaRoot>
              <AuthLayout>{children}</AuthLayout>
            </PwaRoot>
          </SessionProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
