import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Prisma must run on the Node.js runtime (not Edge).
  serverExternalPackages: ["@prisma/client", "prisma"],
  devIndicators: false,
};

export default nextConfig;
