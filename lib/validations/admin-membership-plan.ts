import { z } from "zod";

export const adminMembershipPlanSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1),
  priceCents: z.number().int().min(0),
  interval: z.enum(["month", "year"]).default("month"),
  perks: z.array(z.string()).default([]),
  detailDiscountPct: z.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
});

export type AdminMembershipPlanInput = z.infer<typeof adminMembershipPlanSchema>;
