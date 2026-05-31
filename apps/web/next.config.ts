import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Origins the browser is allowed to `fetch()` from. The simulation API lives
 * on a separate origin (see `NEXT_PUBLIC_API_BASE_URL`, baked at build time),
 * so it must be explicitly allow-listed in `connect-src` or the CSP will block
 * every /api/simulate call.
 */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.learnsystemdesign.net";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` is currently required for both scripts and styles: Next's
 * App Router injects inline bootstrap scripts and we render inline `style={}`
 * attributes throughout. Tightening to a nonce-based policy needs middleware
 * (we have none today) — tracked as a follow-up. In dev we additionally allow
 * `'unsafe-eval'` and websocket connections for Turbopack/HMR.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiBase}${isDev ? " ws: http://localhost:4000" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  transpilePackages: ["@flow/shared"],
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
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
