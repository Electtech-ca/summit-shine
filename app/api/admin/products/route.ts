import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminProductSchema } from "@/lib/validations/admin-product";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "Product",
    entityId: product.id,
    after: product,
  });

  return NextResponse.json(product, { status: 201 });
}
