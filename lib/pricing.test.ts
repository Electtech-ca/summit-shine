import { describe, expect, it } from "vitest";
import {
  calculateDiscount,
  calculateLineTotal,
  calculatePricing,
  calculateSubtotal,
  type PricingDiscount,
  type PricingLineItem,
  type TaxRates,
} from "./pricing";

const BC_TAX: TaxRates = { gstPct: 5, pstPct: 7 };

describe("calculateLineTotal", () => {
  it("multiplies unit price by quantity", () => {
    const item: PricingLineItem = { id: "a", name: "Express Wash", unitPriceCents: 1299, quantity: 2 };
    expect(calculateLineTotal(item)).toBe(2598);
  });

  it("adds the vehicle size delta before multiplying by quantity", () => {
    const item: PricingLineItem = {
      id: "a",
      name: "Deluxe Wash",
      unitPriceCents: 1999,
      quantity: 1,
      sizeDeltaCents: 1000, // SUV
    };
    expect(calculateLineTotal(item)).toBe(2999);
  });

  it("defaults sizeDeltaCents to 0 when omitted", () => {
    const item: PricingLineItem = { id: "a", name: "Wash", unitPriceCents: 1000, quantity: 1 };
    expect(calculateLineTotal(item)).toBe(1000);
  });
});

describe("calculateSubtotal", () => {
  it("sums multiple line items", () => {
    const items: PricingLineItem[] = [
      { id: "a", name: "Express", unitPriceCents: 1299, quantity: 1 },
      { id: "b", name: "Wax", unitPriceCents: 8999, quantity: 1, sizeDeltaCents: 1500 },
    ];
    expect(calculateSubtotal(items)).toBe(1299 + 8999 + 1500);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe("calculateDiscount", () => {
  const items: PricingLineItem[] = [
    { id: "svc-1", name: "Ultimate Wash", unitPriceCents: 2999, quantity: 1 },
    { id: "svc-2", name: "Ceramic Coating", unitPriceCents: 49900, quantity: 1 },
  ];

  it("returns 0 when there is no discount", () => {
    expect(calculateDiscount(items, null)).toBe(0);
    expect(calculateDiscount(items, undefined)).toBe(0);
  });

  it("applies a percentage discount to the full subtotal by default", () => {
    const discount: PricingDiscount = { type: "PERCENTAGE", valuePct: 10 };
    // 10% of (2999 + 49900) = 5289.9 -> rounds to 5290
    expect(calculateDiscount(items, discount)).toBe(5290);
  });

  it("applies a fixed discount in cents", () => {
    const discount: PricingDiscount = { type: "FIXED", valueCents: 1000 };
    expect(calculateDiscount(items, discount)).toBe(1000);
  });

  it("caps a fixed discount at the eligible subtotal instead of going negative", () => {
    const smallCart: PricingLineItem[] = [{ id: "svc-1", name: "Express", unitPriceCents: 1299, quantity: 1 }];
    const discount: PricingDiscount = { type: "FIXED", valueCents: 5000 };
    expect(calculateDiscount(smallCart, discount)).toBe(1299);
  });

  it("scopes a discount to matching line item ids only", () => {
    const discount: PricingDiscount = {
      type: "PERCENTAGE",
      valuePct: 15,
      appliesToIds: ["svc-2"], // 15% off ceramic coating only
    };
    expect(calculateDiscount(items, discount)).toBe(Math.round(49900 * 0.15));
  });

  it("returns 0 when scoped ids don't match any line item", () => {
    const discount: PricingDiscount = { type: "PERCENTAGE", valuePct: 15, appliesToIds: ["svc-999"] };
    expect(calculateDiscount(items, discount)).toBe(0);
  });

  it("withholds the discount when the order subtotal is below minSpendCents", () => {
    const discount: PricingDiscount = { type: "FIXED", valueCents: 1000, minSpendCents: 100000 };
    expect(calculateDiscount(items, discount)).toBe(0);
  });

  it("applies the discount once the order subtotal meets minSpendCents", () => {
    const discount: PricingDiscount = { type: "FIXED", valueCents: 1000, minSpendCents: 50000 };
    expect(calculateDiscount(items, discount)).toBe(1000);
  });

  it("evaluates minSpendCents against the full order, not just the scoped items", () => {
    // svc-1 alone is below the min spend, but the full cart (with svc-2) clears it.
    const discount: PricingDiscount = {
      type: "PERCENTAGE",
      valuePct: 10,
      appliesToIds: ["svc-1"],
      minSpendCents: 40000,
    };
    expect(calculateDiscount(items, discount)).toBe(Math.round(2999 * 0.1));
  });
});

describe("calculatePricing", () => {
  it("computes GST + PST on the full subtotal when there is no discount", () => {
    const items: PricingLineItem[] = [{ id: "a", name: "Express", unitPriceCents: 1299, quantity: 1 }];
    const result = calculatePricing(items, null, BC_TAX);

    expect(result.subtotalCents).toBe(1299);
    expect(result.discountCents).toBe(0);
    expect(result.taxableCents).toBe(1299);
    expect(result.gstCents).toBe(Math.round(1299 * 0.05));
    expect(result.pstCents).toBe(Math.round(1299 * 0.07));
    expect(result.taxCents).toBe(result.gstCents + result.pstCents);
    expect(result.totalCents).toBe(result.taxableCents + result.taxCents);
  });

  it("taxes the post-discount amount, not the pre-discount subtotal", () => {
    const items: PricingLineItem[] = [{ id: "a", name: "Ultimate Wash", unitPriceCents: 2999, quantity: 1 }];
    const discount: PricingDiscount = { type: "PERCENTAGE", valuePct: 10 };
    const result = calculatePricing(items, discount, BC_TAX);

    const expectedDiscount = Math.round(2999 * 0.1);
    const expectedTaxable = 2999 - expectedDiscount;

    expect(result.discountCents).toBe(expectedDiscount);
    expect(result.taxableCents).toBe(expectedTaxable);
    expect(result.gstCents).toBe(Math.round(expectedTaxable * 0.05));
    expect(result.pstCents).toBe(Math.round(expectedTaxable * 0.07));
  });

  it("applies the vehicle size modifier before tax and discount", () => {
    const items: PricingLineItem[] = [
      { id: "a", name: "Deluxe Wash", unitPriceCents: 1999, quantity: 1, sizeDeltaCents: 1500 }, // TRUCK
    ];
    const result = calculatePricing(items, null, BC_TAX);

    expect(result.subtotalCents).toBe(3499);
  });

  it("handles multiple items with quantities, a scoped discount, and tax together", () => {
    const items: PricingLineItem[] = [
      { id: "svc-express", name: "Express Exterior", unitPriceCents: 1299, quantity: 2 },
      { id: "svc-ceramic", name: "Ceramic Coating", unitPriceCents: 49900, quantity: 1, sizeDeltaCents: 2500 },
    ];
    const discount: PricingDiscount = {
      type: "PERCENTAGE",
      valuePct: 15,
      appliesToIds: ["svc-ceramic"],
    };
    const result = calculatePricing(items, discount, BC_TAX);

    const subtotal = 1299 * 2 + (49900 + 2500);
    const expectedDiscount = Math.round((49900 + 2500) * 0.15);
    const taxable = subtotal - expectedDiscount;

    expect(result.subtotalCents).toBe(subtotal);
    expect(result.discountCents).toBe(expectedDiscount);
    expect(result.taxableCents).toBe(taxable);
    expect(result.gstCents).toBe(Math.round(taxable * 0.05));
    expect(result.pstCents).toBe(Math.round(taxable * 0.07));
    expect(result.totalCents).toBe(taxable + result.gstCents + result.pstCents);
  });

  it("never produces a negative taxable amount even with an oversized fixed discount", () => {
    const items: PricingLineItem[] = [{ id: "a", name: "Express", unitPriceCents: 1299, quantity: 1 }];
    const discount: PricingDiscount = { type: "FIXED", valueCents: 999999 };
    const result = calculatePricing(items, discount, BC_TAX);

    expect(result.taxableCents).toBe(0);
    expect(result.gstCents).toBe(0);
    expect(result.pstCents).toBe(0);
    expect(result.totalCents).toBe(0);
  });

  it("returns all zeros for an empty cart", () => {
    const result = calculatePricing([], null, BC_TAX);
    expect(result).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      taxableCents: 0,
      gstCents: 0,
      pstCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it("supports zero-rate tax (e.g. a tax-exempt gift card order)", () => {
    const items: PricingLineItem[] = [{ id: "gift-50", name: "Gift Card $50", unitPriceCents: 5000, quantity: 1 }];
    const result = calculatePricing(items, null, { gstPct: 0, pstPct: 0 });

    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(5000);
  });
});
