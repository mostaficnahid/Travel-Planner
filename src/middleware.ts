import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — enforces per-IP rate limiting on expensive API routes.
 *
 * Limits (per IP address):
 *   POST /api/ai/chat        → 20 requests / 60 seconds
 *   POST /api/trips          → 10 requests / 60 seconds  (AI generation is expensive)
 *   POST /api/auth/register  → 5  requests / 60 seconds  (prevent account spam)
 *
 * Note: Middleware runs in the Edge Runtime — module-level Map state is NOT shared
 * with API route handlers. We implement a lightweight rolling-window counter here
 * using Response headers as the source of truth (stateless per request), tracking
 * via a simple KV approach on Edge.
 *
 * For full accuracy in production, replace with Upstash Redis KV.
 */

// Rate-limit config per route pattern
const LIMITS: Array<{ pattern: RegExp; method: string; limit: number; windowSec: number }> = [
  { pattern: /^\/api\/ai\/chat$/, method: "POST", limit: 20, windowSec: 60 },
  { pattern: /^\/api\/trips$/, method: "POST", limit: 10, windowSec: 60 },
  { pattern: /^\/api\/auth\/register$/, method: "POST", limit: 5, windowSec: 60 },
];

// In-memory store for Edge Middleware (per worker instance)
// Key: `${ip}:${route}`, Value: { count, resetAt }
const edgeStore = new Map<string, { count: number; resetAt: number }>();

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  const matchedRule = LIMITS.find(
    (r) => r.pattern.test(pathname) && r.method === method
  );

  if (!matchedRule) return NextResponse.next();

  // Extract IP — X-Forwarded-For for proxied requests, fallback to "unknown"
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const key = `${ip}:${pathname}`;

  const now = Date.now();
  const windowMs = matchedRule.windowSec * 1000;
  const entry = edgeStore.get(key);

  if (!entry || now >= entry.resetAt) {
    edgeStore.set(key, { count: 1, resetAt: now + windowMs });
    return NextResponse.next();
  }

  if (entry.count >= matchedRule.limit) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Please wait ${retryAfterSec}s before trying again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(matchedRule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  entry.count += 1;
  const remaining = matchedRule.limit - entry.count;

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(matchedRule.limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  return response;
}

export const config = {
  matcher: ["/api/ai/chat", "/api/trips", "/api/auth/register"],
};
