import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  date: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [year, month, day] = parsed.data.date.split("-").map(Number);
  const blackout = await prisma.blackoutDate.create({
    data: { date: new Date(year, month - 1, day), reason: parsed.data.reason },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "BlackoutDate",
    entityId: blackout.id,
    after: blackout,
  });

  return NextResponse.json(blackout, { status: 201 });
}
