import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const captureException = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const { formatError } = await import("@/lib/utils/server");
const { Prisma } = await import("@/lib/generated/prisma/client");

const knownRequestError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("db error", {
    code,
    clientVersion: "test",
    meta: { target: ["email"] },
  });

describe("formatError", () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it("shows messages we throw on purpose, without reporting them", () => {
    expect(formatError(new Error("Order not found"))).toBe("Order not found");
    expect(captureException).not.toHaveBeenCalled();
  });

  it("joins validation messages, without reporting them", () => {
    const result = z.object({ name: z.string().min(3, "Name is too short") }).safeParse({ name: "a" });

    expect(formatError(result.error)).toBe("Name is too short");
    expect(captureException).not.toHaveBeenCalled();
  });

  it("explains duplicate values, without reporting them", () => {
    expect(formatError(knownRequestError("P2002"))).toBe("Email already exists");
    expect(captureException).not.toHaveBeenCalled();
  });

  it("reports code bugs and hides their details from customers", () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'findMany')");

    expect(formatError(bug)).toBe("Something went wrong. Please try again.");
    expect(captureException).toHaveBeenCalledWith(bug);
  });

  it("reports other database errors and hides their details", () => {
    const dbError = knownRequestError("P2003");

    expect(formatError(dbError)).toBe("Something went wrong. Please try again.");
    expect(captureException).toHaveBeenCalledWith(dbError);
  });

  it("reports values that aren't errors", () => {
    expect(formatError("boom")).toBe("Something went wrong");
    expect(captureException).toHaveBeenCalledWith("boom");
  });
});
