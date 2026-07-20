import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminProductSchema } from "@/lib/validations/admin-product";
import { writeAuditLog } from "@/lib/audit-log";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });

  await writeAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "Product",
    entityId: product.id,
    before,
    after: product,
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.product.update({ where: { id: params.id }, data: { active: false } });

  await writeAuditLog({
    userId: session.userId,
    action: "DEACTIVATE",
    entity: "Product",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
