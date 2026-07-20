import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { refundBooking } from "@/lib/stripe-refund";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  amountCents: z.number().int().positive().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const before = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  try {
    const refund = await refundBooking(params.id, parsed.data.amountCents);

    const after = await prisma.booking.findUnique({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REFUND",
        entity: "Booking",
        entityId: params.id,
        before: { paymentStatus: before.paymentStatus },
        after: { paymentStatus: after?.paymentStatus, stripeRefundId: refund.id },
      },
    });

    return NextResponse.json({ refundId: refund.id, status: after?.paymentStatus });
  } catch (err) {
    return handleApiError(err);
  }
}
