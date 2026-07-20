import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { handleApiError } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const membership = await prisma.membership.findUnique({ where: { id: params.id } });
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

  try {
    if (membership.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
    }

    const updated = await prisma.membership.update({
      where: { id: params.id },
      data: { status: "canceled" },
    });

    await writeAuditLog({
      userId: session.userId,
      action: "CANCEL",
      entity: "Membership",
      entityId: params.id,
      before: { status: membership.status },
      after: { status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
