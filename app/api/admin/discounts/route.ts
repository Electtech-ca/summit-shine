import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminDiscountSchema } from "@/lib/validations/admin-discount";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const discounts = await prisma.discount.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(discounts);
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const code = parsed.data.code?.trim().toUpperCase() || null;
  if (code) {
    const existing = await prisma.discount.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "This code already exists" }, { status: 409 });
  }

  const discount = await prisma.discount.create({
    data: {
      ...parsed.data,
      code,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "Discount",
    entityId: discount.id,
    after: discount,
  });

  return NextResponse.json(discount, { status: 201 });
}
