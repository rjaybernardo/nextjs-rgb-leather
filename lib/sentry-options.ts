import type { init } from "@sentry/nextjs";

/*
 * Shared Sentry settings for browser, server and edge.
 *
 * Privacy (Data Privacy Act of 2012): the SDK collects cookies, request
 * bodies, query values, database parameters and local variables by default.
 * Those can hold passwords, addresses, phone numbers and the email/token in
 * password-reset links, so collection is limited to what debugging needs.
 */
type SentryOptions = NonNullable<Parameters<typeof init>[0]>;

export const sentryDataCollection: SentryOptions["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { allow: ["user-agent", "content-type", "accept-language"] },
    response: false,
  },
  httpBodies: [],
  // Search filters and paging only; reset/verify links carry email + token
  urlQueryParams: {
    allow: ["q", "category", "price", "rating", "sort", "page", "payment"],
  },
  databaseQueryData: false,
  stackFrameVariables: false,
  queues: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
};

export const sentryTracesSampleRate =
  process.env.NODE_ENV === "development" ? 1.0 : 0.1;
