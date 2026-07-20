import { z } from "zod";

export const adminProductSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().min(1),
  images: z.array(z.string()).default([]),
  priceCents: z.number().int().min(0),
  salePriceCents: z.number().int().min(0).nullable().optional(),
  sku: z.string().max(60).nullable().optional(),
  stockQty: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(5),
  active: z.boolean().default(true),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;
