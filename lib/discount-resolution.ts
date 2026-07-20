import { prisma } from "@/lib/prisma";
import type { PricingDiscount } from "@/lib/pricing";

export type DiscountResolution =
  | { ok: true; discountId: string; pricingDiscount: PricingDiscount }
  | { ok: false; error: string };

/**
 * Validates a promo code against active/date-window/usage-limit/scoping
 * rules and, if valid, returns the resolved PricingDiscount for the pure
 * pricing engine to apply. Server-side only — never trust a client-computed
 * discount amount.
 */
export async function resolveDiscountByCode(
  code: string,
  serviceIds: string[],
  userId?: string,
): Promise<DiscountResolution> {
  const discount = await prisma.discount.findUnique({ where: { code } });
  if (!discount || !discount.active) {
    return { ok: false, error: "Invalid promo code" };
  }

  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) {
    return { ok: false, error: "This promo code is not yet active" };
  }
  if (discount.endsAt && now > discount.endsAt) {
    return { ok: false, error: "This promo code has expired" };
  }
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return { ok: false, error: "This promo code has reached its usage limit" };
  }

  if (discount.usesPerCustomer != null && userId) {
    const timesUsed = await prisma.booking.count({
      where: { userId, discountId: discount.id },
    });
    if (timesUsed >= discount.usesPerCustomer) {
      return { ok: false, error: "You've already used this promo code" };
    }
  }

  const appliesToIds = discount.appliesToServiceIds.length > 0 ? discount.appliesToServiceIds : undefined;
  if (appliesToIds && !serviceIds.some((id) => appliesToIds.includes(id))) {
    return { ok: false, error: "This promo code doesn't apply to the selected services" };
  }

  return {
    ok: true,
    discountId: discount.id,
    pricingDiscount: {
      type: discount.type,
      valuePct: discount.valuePct ?? undefined,
      valueCents: discount.valueCents ?? undefined,
      minSpendCents: discount.minSpendCents ?? undefined,
      appliesToIds,
    },
  };
}
