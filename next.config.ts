import type { NextConfig } from "next";

// Content-Security-Policy shipped in Report-Only mode: it cannot block anything,
// it only logs violations to the browser console (and to `report-uri` if one is
// configured). This lets us verify the policy against MUI/Emotion's injected
// styles, Google avatar images, and Next's RSC payload scripts before ever
// switching it to an enforcing header.
//
// 'unsafe-inline' is required for style-src (Emotion/MUI inject <style> tags)
// and for script-src (Next's App Router streams RSC payloads via inline
// <script> tags). A stricter nonce-based policy is possible but needs
// per-request nonce plumbing through middleware — left as a follow-up.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Report-only for now — see comment above. Only enabled for production builds
  // to keep `next dev`'s console free of HMR-related noise.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY }]
    : []),
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
