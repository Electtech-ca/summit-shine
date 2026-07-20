// Pure pricing calculator: line items + vehicle size + a resolved discount +
// tax rates -> totals. All money is integer cents. No I/O, no DB access —
// callers (booking wizard, cart, admin previews) resolve prices, discount
// eligibility, and tax rates from the DB and pass them in here.

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface PricingLineItem {
  /** Service or product id — used to match discount scoping via appliesToIds. */
  id: string;
  name: string;
  /** Resolved unit price in cents (the sale price, if one applies). */
  unitPriceCents: number;
  quantity: number;
  /** Vehicle-size modifier in cents, added once per unit (services only). */
  sizeDeltaCents?: number;
}

export interface PricingDiscount {
  type: DiscountType;
  /** Required when type is PERCENTAGE. Whole percentage points, e.g. 10 for 10%. */
  valuePct?: number;
  /** Required when type is FIXED. Cents. */
  valueCents?: number;
  /** Discount only applies if the full order subtotal is at least this. */
  minSpendCents?: number;
  /** If set, the discount only applies against line items with a matching id. */
  appliesToIds?: string[];
}

export interface TaxRates {
  gstPct: number;
  pstPct: number;
}

export interface PricingResult {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  gstCents: number;
  pstCents: number;
  taxCents: number;
  totalCents: number;
}

export function calculateLineTotal(item: PricingLineItem): number {
  return (item.unitPriceCents + (item.sizeDeltaCents ?? 0)) * item.quantity;
}

export function calculateSubtotal(items: PricingLineItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

export function calculateDiscount(
  items: PricingLineItem[],
  discount: PricingDiscount | null | undefined,
): number {
  if (!discount) return 0;

  const fullSubtotal = calculateSubtotal(items);
  if (discount.minSpendCents != null && fullSubtotal < discount.minSpendCents) {
    return 0;
  }

  const eligibleItems =
    discount.appliesToIds && discount.appliesToIds.length > 0
      ? items.filter((item) => discount.appliesToIds!.includes(item.id))
      : items;
  const eligibleSubtotal = calculateSubtotal(eligibleItems);
  if (eligibleSubtotal <= 0) return 0;

  const rawAmount =
    discount.type === "PERCENTAGE"
      ? Math.round((eligibleSubtotal * (discount.valuePct ?? 0)) / 100)
      : (discount.valueCents ?? 0);

  return Math.max(0, Math.min(rawAmount, eligibleSubtotal));
}

export function calculatePricing(
  items: PricingLineItem[],
  discount: PricingDiscount | null | undefined,
  tax: TaxRates,
): PricingResult {
  const subtotalCents = calculateSubtotal(items);
  const discountCents = calculateDiscount(items, discount);
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const gstCents = Math.round((taxableCents * tax.gstPct) / 100);
  const pstCents = Math.round((taxableCents * tax.pstPct) / 100);
  const taxCents = gstCents + pstCents;
  const totalCents = taxableCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    taxableCents,
    gstCents,
    pstCents,
    taxCents,
    totalCents,
  };
}
