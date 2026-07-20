import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  paymentStatus: z.enum(["UNPAID", "DEPOSIT_PAID", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { items: { include: { service: true } }, vehicle: true, user: true, discount: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json(booking);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const before = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const booking = await prisma.booking.update({ where: { id: params.id }, data: parsed.data });

  await writeAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "Booking",
    entityId: booking.id,
    before: { status: before.status, paymentStatus: before.paymentStatus },
    after: { status: booking.status, paymentStatus: booking.paymentStatus },
  });

  return NextResponse.json(booking);
}
