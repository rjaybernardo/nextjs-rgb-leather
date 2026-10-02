"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

type ErrorViewProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

const ErrorView = ({ error, retry }: ErrorViewProps) => {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">
          Something went wrong
        </h1>

        <p className="mt-3 text-muted-foreground">
          This page couldn&apos;t load. Try again, or go back to the home page.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => retry()}>Try again</Button>

          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ErrorView;
