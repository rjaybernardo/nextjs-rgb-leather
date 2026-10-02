import "server-only";

import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";

import { Prisma } from "@/lib/generated/prisma/client";

// Code bugs, as opposed to messages we throw on purpose ("Order not found")
const BUG_ERRORS = [TypeError, ReferenceError, RangeError, SyntaxError];

/*
 * Server actions catch errors to show a message, so Sentry would never see
 * them. Report the unexpected ones: code bugs, database errors other than a
 * duplicate value, and anything that isn't an Error at all.
 */
function reportIfUnexpected(error: unknown) {
  const isExpected =
    error instanceof ZodError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002") ||
    (error instanceof Error &&
      !BUG_ERRORS.some((type) => error instanceof type) &&
      !(error instanceof Prisma.PrismaClientKnownRequestError) &&
      !(error instanceof Prisma.PrismaClientUnknownRequestError) &&
      !(error instanceof Prisma.PrismaClientInitializationError) &&
      !(error instanceof Prisma.PrismaClientValidationError));

  if (!isExpected) {
    Sentry.captureException(error);
  }
}

export function formatError(error: unknown): string {
  reportIfUnexpected(error);

  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(". ");
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;

    const field = Array.isArray(target)
      ? target[0]
      : typeof target === "string"
        ? target
        : "Field";

    return `${String(field).charAt(0).toUpperCase()}${String(field).slice(
      1,
    )} already exists`;
  }

  // Don't show customers raw database or code error text
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError ||
    BUG_ERRORS.some((type) => error instanceof type)
  ) {
    return "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
