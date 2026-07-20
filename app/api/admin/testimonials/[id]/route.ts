import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({ approved: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const testimonial = await prisma.testimonial.update({
    where: { id: params.id },
    data: { approved: parsed.data.approved },
  });

  await writeAuditLog({
    userId: session.userId,
    action: parsed.data.approved ? "APPROVE" : "REJECT",
    entity: "Testimonial",
    entityId: params.id,
  });

  return NextResponse.json(testimonial);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  await prisma.testimonial.delete({ where: { id: params.id } });
  await writeAuditLog({ userId: session.userId, action: "DELETE", entity: "Testimonial", entityId: params.id });

  return NextResponse.json({ ok: true });
}
