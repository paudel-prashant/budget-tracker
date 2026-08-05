import NextAuth from "next-auth";
import authConfig from "@/auth/config";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const { auth } = NextAuth(authConfig);

// Per-user request budgets for API routes. Best-effort (see lib/utils/rate-limit.ts) —
// mainly a guard against runaway client loops and casual abuse, and a way to protect a
// free-tier database from being hammered rather than a hard security boundary.
const DEFAULT_API_RATE_LIMIT = { limit: 120, windowMs: 60_000 }; // 120 req/min per user
const ASSISTANT_RATE_LIMIT = { limit: 15, windowMs: 5 * 60_000 }; // 15 req/5min per user

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/offline" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/workbox-") ||
    pathname.startsWith("/api/auth") ||
    // Vercel Cron has no browser session — this route authenticates itself via
    // CRON_SECRET (see lib/auth/cron-auth.ts), not the session cookie.
    pathname.startsWith("/api/cron/");

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Rate limit our own API surface only (not NextAuth's /api/auth/* routes — those
  // handle sign-in/callback/session and must never be throttled here).
  const userId = req.auth?.user?.id;
  if (isLoggedIn && userId && pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const isAssistantPost = pathname === "/api/assistant" && req.method === "POST";
    const { limit, windowMs } = isAssistantPost ? ASSISTANT_RATE_LIMIT : DEFAULT_API_RATE_LIMIT;
    const bucketKey = `${isAssistantPost ? "assistant" : "api"}:${userId}`;
    const result = checkRateLimit(bucketKey, limit, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
      );
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|manifest\\.webmanifest|icons/|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
