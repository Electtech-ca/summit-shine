import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminServiceSchema } from "@/lib/validations/admin-service";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const services = await prisma.service.findMany({
    include: { category: true, sizeModifiers: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.service.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A service with this slug already exists" }, { status: 409 });
  }

  const { sizeModifiers, ...serviceData } = parsed.data;
  const service = await prisma.service.create({
    data: {
      ...serviceData,
      sizeModifiers: { create: sizeModifiers },
    },
    include: { sizeModifiers: true, category: true },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "Service",
    entityId: service.id,
    after: service,
  });

  return NextResponse.json(service, { status: 201 });
}
