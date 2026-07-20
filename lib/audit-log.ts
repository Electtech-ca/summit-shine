import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Round-trips through JSON.stringify so Date objects (and anything else
// non-JSON-serializable) on Prisma model instances become plain values —
// Prisma's JSON columns reject Date objects directly at runtime.
function toJsonSafe(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: toJsonSafe(params.before),
      after: toJsonSafe(params.after),
    },
  });
}
