import { z } from "zod";

export const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required").max(60),
  model: z.string().min(1, "Model is required").max(60),
  colour: z.string().max(40).optional().or(z.literal("")),
  plate: z.string().max(20).optional().or(z.literal("")),
  size: z.enum(["SEDAN", "SUV", "TRUCK", "OVERSIZED"]),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
