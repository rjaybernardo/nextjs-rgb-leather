import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Actor = {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null;

/*
 * Records an admin action. Never throws: a failed log entry must not undo
 * or block the change it describes, so failures are only logged.
 */
export async function recordAudit({
  actor,
  action,
  entityType,
  entityId,
  details,
}: {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.user?.id ?? null,
        actorEmail: actor?.user?.email ?? "unknown",
        action,
        entityType,
        entityId: entityId ?? null,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log entry", error);
  }
}
