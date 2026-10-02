import * as Sentry from "@sentry/nextjs";

import {
  sentryDataCollection,
  sentryTracesSampleRate,
} from "./lib/sentry-options";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

// Error monitoring in the edge runtime; does nothing until a DSN is configured
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV,
  // Customer data stays out of reports; see lib/sentry-options.ts
  dataCollection: sentryDataCollection,
  tracesSampleRate: sentryTracesSampleRate,
});
