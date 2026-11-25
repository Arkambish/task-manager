import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Same default as src/lib/api-client.ts. The browser is only allowed to send
// requests to the page's own origin and to this address.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Content Security Policy: a list of what the page may load and where it may
 * connect. If someone did manage to inject markup into the page, the browser
 * would still refuse to load their script, frame the app, or send data to a
 * server that is not on this list.
 *
 * 'unsafe-inline' is needed because Next.js puts small inline scripts and
 * styles into the HTML. Removing it needs a per-request nonce, which would
 * stop the page from being served as static HTML.
 *
 * Development is slightly looser, and only development: React needs
 * 'unsafe-eval' for debugging, and local tools (hot reload, editor
 * extensions) talk to the page over websockets on this machine.
 */
const devOnlyConnections = isDev ? " ws://localhost:* ws://127.0.0.1:*" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self' ${apiUrl}${devOnlyConnections}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Do not guess a file's type from its content.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Older browsers' version of frame-ancestors: no embedding in a frame.
  { key: "X-Frame-Options", value: "DENY" },
  // Send only the origin, not the full URL, when following a link elsewhere.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app uses none of these device features, so switch them off.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Do not advertise the framework in an "X-Powered-By" header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
