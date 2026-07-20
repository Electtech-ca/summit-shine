import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

async function requireAdminOnly() {
  const session = await auth();
  if (!session?.user) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (session.user.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admins only" };
  return { ok: true as const, userId: session.user.id };
}

export async function GET() {
  const session = await requireAdminOnly();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(staff);
}

const schema = z.object({ email: z.string().email(), role: z.enum(["STAFF", "ADMIN"]) });

export async function POST(req: Request) {
  const session = await requireAdminOnly();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { role: parsed.data.role } })
    : await prisma.user.create({ data: { email: parsed.data.email, role: parsed.data.role } });

  await writeAuditLog({
    userId: session.userId,
    action: existing ? "PROMOTE" : "INVITE",
    entity: "User",
    entityId: user.id,
    after: { email: user.email, role: user.role },
  });

  return NextResponse.json(user, { status: 201 });
}
