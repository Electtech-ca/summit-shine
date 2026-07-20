import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Ensures a MembershipPlan has a live Stripe Product + Price, creating them
 * on first use (lazy sync). When the admin panel (step 7) edits a plan's
 * price, it should create a new Stripe Price and archive the old one rather
 * than mutating this one, since Stripe Prices are immutable.
 */
export async function ensureStripePriceForPlan(planId: string): Promise<string> {
  const plan = await prisma.membershipPlan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.stripePriceId) return plan.stripePriceId;

  const product =
    plan.stripeProductId
      ? await stripe.products.retrieve(plan.stripeProductId)
      : await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: { membershipPlanId: plan.id },
        });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.priceCents,
    currency: "cad",
    recurring: { interval: plan.interval === "year" ? "year" : "month" },
    metadata: { membershipPlanId: plan.id },
  });

  await prisma.membershipPlan.update({
    where: { id: plan.id },
    data: { stripeProductId: product.id, stripePriceId: price.id },
  });

  return price.id;
}
