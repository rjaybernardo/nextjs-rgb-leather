import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/*
 * Content-Security-Policy without nonces (Next's inline scripts need
 * 'unsafe-inline'). Browser-side third parties:
 * - UploadThing: admin image uploads go straight to its servers
 * PayMongo checkout is a full-page redirect, which CSP doesn't restrict.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://utfs.io https://*.ufs.sh",
  "font-src 'self'",
  `connect-src 'self' https://*.uploadthing.com https://*.ingest.uploadthing.com https://utfs.io https://*.ufs.sh${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Browsers only honor HSTS over HTTPS; skip it locally
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client", "pg"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

/*
 * Sentry: the DSN (in instrumentation files) turns reporting on. Source maps
 * upload during builds only when SENTRY_AUTH_TOKEN, SENTRY_ORG and
 * SENTRY_PROJECT are set, so stack traces show your real code.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Send browser reports through this site so the CSP and ad blockers
  // don't drop them
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  // Without a token there is nothing to upload; skip instead of warning
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  release: {
    create: Boolean(process.env.SENTRY_AUTH_TOKEN),
  },
  // Don't send the build plugin's own usage data to Sentry
  telemetry: false,
  silent: !process.env.CI,
});
