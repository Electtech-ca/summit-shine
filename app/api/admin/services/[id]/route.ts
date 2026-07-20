import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminServiceSchema } from "@/lib/validations/admin-service";
import { writeAuditLog } from "@/lib/audit-log";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.service.findUnique({
    where: { id: params.id },
    include: { sizeModifiers: true },
  });
  if (!before) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const { sizeModifiers, ...serviceData } = parsed.data;

  const service = await prisma.$transaction(async (tx) => {
    await tx.sizeModifier.deleteMany({ where: { serviceId: params.id } });
    return tx.service.update({
      where: { id: params.id },
      data: {
        ...serviceData,
        sizeModifiers: { create: sizeModifiers },
      },
      include: { sizeModifiers: true, category: true },
    });
  });

  await writeAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "Service",
    entityId: service.id,
    before,
    after: service,
  });

  return NextResponse.json(service);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const before = await prisma.service.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await prisma.service.update({ where: { id: params.id }, data: { active: false } });

  await writeAuditLog({
    userId: session.userId,
    action: "DEACTIVATE",
    entity: "Service",
    entityId: params.id,
    before,
  });

  return NextResponse.json({ ok: true });
}
