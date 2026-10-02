"use client";

import "./globals.css";

import ErrorView from "@/components/shared/error-view";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong</title>
        <ErrorView error={error} retry={retry} />
      </body>
    </html>
  );
}
