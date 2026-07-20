import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  if (session.user.id === params.id) {
    return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: params.id }, data: { role: "CUSTOMER" } });

  await writeAuditLog({
    userId: session.user.id,
    action: "DEMOTE",
    entity: "User",
    entityId: user.id,
    after: { email: user.email, role: user.role },
  });

  return NextResponse.json({ ok: true });
}
