import { z } from "zod";

export const checkoutSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) }))
    .min(1),
  promoCode: z.string().max(40).optional(),
  guestEmail: z.string().email().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
