import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminMembershipPlanSchema } from "@/lib/validations/admin-membership-plan";
import { writeAuditLog } from "@/lib/audit-log";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = adminMembershipPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.membershipPlan.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const priceChanged =
    parsed.data.priceCents !== before.priceCents || parsed.data.interval !== before.interval;

  let stripePriceId = before.stripePriceId;

  if (priceChanged && before.stripeProductId) {
    try {
      const newPrice = await stripe.prices.create({
        product: before.stripeProductId,
        unit_amount: parsed.data.priceCents,
        currency: "cad",
        recurring: { interval: parsed.data.interval },
        metadata: { membershipPlanId: params.id },
      });
      if (before.stripePriceId) {
        await stripe.prices.update(before.stripePriceId, { active: false });
      }
      stripePriceId = newPrice.id;
    } catch (err) {
      return handleApiError(err);
    }
  }

  const plan = await prisma.membershipPlan.update({
    where: { id: params.id },
    data: { ...parsed.data, stripePriceId },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "UPDATE",
    entity: "MembershipPlan",
    entityId: plan.id,
    before,
    after: plan,
  });

  return NextResponse.json(plan);
}
