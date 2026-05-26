import type { NextConfig } from "next";

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

export default nextConfig;
