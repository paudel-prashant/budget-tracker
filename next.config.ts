import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  scope: "/",
  sw: "sw.js",
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    navigateFallback: "/offline",
    navigateFallbackDenylist: [/^\/api\//, /^\/login/, /^\/_next\//, /^\/offline$/],
    runtimeCaching: [
      {
        urlPattern: /\/api\/(transactions|summary|insights|budgets|dashboard)/,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "budgetrax-api-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  devIndicators: false,
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default withPWA(nextConfig);
