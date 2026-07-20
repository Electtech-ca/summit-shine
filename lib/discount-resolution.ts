import { prisma } from "@/lib/prisma";
import type { Discount } from "@prisma/client";
import { calculateDiscount, type PricingDiscount, type PricingLineItem } from "@/lib/pricing";

export type DiscountScope = "service" | "product";

export type DiscountResolution =
  | { ok: true; discountId: string; pricingDiscount: PricingDiscount }
  | { ok: false; error: string };

function scopeIds(discount: Discount, scope: DiscountScope): string[] {
  return scope === "service" ? discount.appliesToServiceIds : discount.appliesToProductIds;
}

function toPricingDiscount(discount: Discount, scope: DiscountScope): PricingDiscount {
  const ids = scopeIds(discount, scope);
  return {
    type: discount.type,
    valuePct: discount.valuePct ?? undefined,
    valueCents: discount.valueCents ?? undefined,
    minSpendCents: discount.minSpendCents ?? undefined,
    appliesToIds: ids.length > 0 ? ids : undefined,
  };
}

async function checkEligibility(
  discount: Discount,
  itemIds: string[],
  scope: DiscountScope,
  userId?: string,
): Promise<string | null> {
  const now = new Date();
  if (!discount.active) return "This discount is not active";
  if (discount.startsAt && now < discount.startsAt) return "This discount is not yet active";
  if (discount.endsAt && now > discount.endsAt) return "This discount has expired";
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return "This discount has reached its usage limit";
  }

  if (discount.usesPerCustomer != null && userId) {
    const timesUsed =
      scope === "service"
        ? await prisma.booking.count({ where: { userId, discountId: discount.id } })
        : await prisma.order.count({ where: { userId, discountId: discount.id } });
    if (timesUsed >= discount.usesPerCustomer) return "Usage limit reached for this customer";
  }

  const ids = scopeIds(discount, scope);
  if (ids.length > 0 && !itemIds.some((id) => ids.includes(id))) {
    return `Doesn't apply to the selected ${scope === "service" ? "services" : "products"}`;
  }

  return null;
}

/**
 * Validates a promo code against active/date-window/usage-limit/scoping
 * rules and, if valid, returns the resolved PricingDiscount for the pure
 * pricing engine to apply. Server-side only — never trust a client-computed
 * discount amount.
 */
export async function resolveDiscountByCode(
  code: string,
  itemIds: string[],
  userId?: string,
  scope: DiscountScope = "service",
): Promise<DiscountResolution> {
  const discount = await prisma.discount.findUnique({ where: { code } });
  if (!discount) return { ok: false, error: "Invalid promo code" };

  const error = await checkEligibility(discount, itemIds, scope, userId);
  if (error) return { ok: false, error };

  return { ok: true, discountId: discount.id, pricingDiscount: toPricingDiscount(discount, scope) };
}

/**
 * Finds the best-value automatic promotion (a Discount row with no code)
 * that currently applies to this cart, if any — e.g. "20% off Ultimate Wash,
 * Dec-Feb" or "Tuesday Senior Discount". Automatic promotions are never
 * combined with a manually entered code (stackable is reserved for future
 * use); callers should prefer an explicit code over this when one is given.
 */
export async function resolveBestAutomaticDiscount(
  items: PricingLineItem[],
  userId?: string,
  scope: DiscountScope = "service",
): Promise<{ discountId: string; pricingDiscount: PricingDiscount } | null> {
  const candidates = await prisma.discount.findMany({
    where: { code: null, active: true },
  });

  let best: { discountId: string; pricingDiscount: PricingDiscount; amount: number } | null = null;

  for (const discount of candidates) {
    const itemIds = items.map((i) => i.id);
    const error = await checkEligibility(discount, itemIds, scope, userId);
    if (error) continue;

    const pricingDiscount = toPricingDiscount(discount, scope);
    const amount = calculateDiscount(items, pricingDiscount);
    if (amount > 0 && (!best || amount > best.amount)) {
      best = { discountId: discount.id, pricingDiscount, amount };
    }
  }

  return best ? { discountId: best.discountId, pricingDiscount: best.pricingDiscount } : null;
}
