import { z } from "zod";

export const adminDiscountSchema = z.object({
  code: z.string().max(40).nullable().optional(),
  name: z.string().min(1).max(120),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  valuePct: z.number().int().min(0).max(100).nullable().optional(),
  valueCents: z.number().int().min(0).nullable().optional(),
  minSpendCents: z.number().int().min(0).nullable().optional(),
  appliesToServiceIds: z.array(z.string()).default([]),
  appliesToProductIds: z.array(z.string()).default([]),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  usesPerCustomer: z.number().int().min(1).nullable().optional(),
  stackable: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type AdminDiscountInput = z.infer<typeof adminDiscountSchema>;
