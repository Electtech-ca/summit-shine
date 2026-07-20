import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe-customer";
import { ensureStripePriceForPlan } from "@/lib/stripe-membership";
import { handleApiError } from "@/lib/api-error";
import { sendMembershipWelcomeEmail } from "@/lib/email";

const schema = z.object({
  planId: z.string().min(1),
  paymentMethodId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.membership.findUnique({ where: { userId: session.user.id } });
  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "You already have an active membership" }, { status: 400 });
  }

  try {
    const [customerId, priceId] = await Promise.all([
      getOrCreateStripeCustomerId(session.user.id),
      ensureStripePriceForPlan(parsed.data.planId),
    ]);

    await stripe.paymentMethods.attach(parsed.data.paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: parsed.data.paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: parsed.data.paymentMethodId,
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: session.user.id, membershipPlanId: parsed.data.planId },
    });

    const currentPeriodEnd = subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null;

    const membership = await prisma.membership.upsert({
      where: { userId: session.user.id },
      update: {
        planId: parsed.data.planId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd,
      },
      create: {
        userId: session.user.id,
        planId: parsed.data.planId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd,
      },
      include: { plan: true },
    });

    if (session.user.email) {
      await sendMembershipWelcomeEmail({
        to: session.user.email,
        planName: membership.plan.name,
        priceCents: membership.plan.priceCents,
      });
    }

    return NextResponse.json(membership, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
