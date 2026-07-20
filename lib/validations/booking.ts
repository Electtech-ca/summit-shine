import { z } from "zod";

export const bookingItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.number().int().min(1).max(5).default(1),
});

export const createBookingSchema = z
  .object({
    items: z.array(bookingItemSchema).min(1, "Select at least one service"),
    vehicleId: z.string().optional(),
    vehicleSize: z.enum(["SEDAN", "SUV", "TRUCK", "OVERSIZED"]).optional(),
    startsAt: z.string().datetime(),
    notes: z.string().max(1000).optional(),
    promoCode: z.string().max(40).optional(),
    guestName: z.string().max(120).optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().max(30).optional(),
    recurrence: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  })
  .refine((data) => data.vehicleId || data.vehicleSize, {
    message: "A vehicle or vehicle size is required",
    path: ["vehicleSize"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
