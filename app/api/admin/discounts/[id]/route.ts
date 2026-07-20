import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminDiscountSchema } from "@/lib/validations/admin-discount";
import { writeAuditLog } from "@/lib/audit-log";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.discount.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Discount not found" }, { status: 404 });

  const code = parsed.data.code?.trim().toUpperCase() || null;

  const discount = await prisma.discount.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      code,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "Discount",
    entityId: discount.id,
    before,
    after: discount,
  });

  return NextResponse.json(discount);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const before = await prisma.discount.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Discount not found" }, { status: 404 });

  await prisma.discount.update({ where: { id: params.id }, data: { active: false } });

  await writeAuditLog({
    userId: session.userId,
    action: "DEACTIVATE",
    entity: "Discount",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
