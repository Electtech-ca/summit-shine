import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().nullable(),
      closeTime: z.string().nullable(),
      closed: z.boolean(),
    }),
  ),
});

export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.$transaction(
    parsed.data.hours.map((h) =>
      prisma.businessHours.upsert({
        where: { dayOfWeek: h.dayOfWeek },
        update: { openTime: h.openTime, closeTime: h.closeTime, closed: h.closed },
        create: h,
      }),
    ),
  );

  await writeAuditLog({ userId: session.userId, action: "UPDATE", entity: "BusinessHours" });

  return NextResponse.json({ ok: true });
}
