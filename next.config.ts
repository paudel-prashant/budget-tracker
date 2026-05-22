import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Prisma must run on the Node.js runtime (not Edge).
  serverExternalPackages: ["@prisma/client", "prisma"],
  devIndicators: false,
  experimental: {
    // Avoid serving stale server-rendered pages after client-side navigation.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
