import { z } from "zod";

export const sizeModifierSchema = z.object({
  size: z.enum(["SEDAN", "SUV", "TRUCK", "OVERSIZED"]),
  deltaCents: z.number().int(),
});

export const adminServiceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().min(1),
  images: z.array(z.string()).default([]),
  durationMin: z.number().int().min(1),
  basePriceCents: z.number().int().min(0),
  salePriceCents: z.number().int().min(0).nullable().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  sizeModifiers: z.array(sizeModifierSchema).default([]),
});

export type AdminServiceInput = z.infer<typeof adminServiceSchema>;
