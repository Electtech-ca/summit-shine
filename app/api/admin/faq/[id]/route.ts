import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const faq = await prisma.faq.update({ where: { id: params.id }, data: parsed.data });
  await writeAuditLog({ userId: session.userId, action: "UPDATE", entity: "Faq", entityId: faq.id, after: faq });

  return NextResponse.json(faq);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  await prisma.faq.delete({ where: { id: params.id } });
  await writeAuditLog({ userId: session.userId, action: "DELETE", entity: "Faq", entityId: params.id });

  return NextResponse.json({ ok: true });
}
