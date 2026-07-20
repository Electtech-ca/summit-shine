import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  await prisma.blackoutDate.delete({ where: { id: params.id } });
  await writeAuditLog({
    userId: session.userId,
    action: "DELETE",
    entity: "BlackoutDate",
    entityId: params.id,
  });

  return NextResponse.json({ ok: true });
}
