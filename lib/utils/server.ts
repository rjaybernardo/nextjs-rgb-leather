import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { ZodError } from "zod";

export function formatError(error: unknown): string {
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

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
