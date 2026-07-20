import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveBestAutomaticDiscount } from "@/lib/discount-resolution";
import type { PricingLineItem } from "@/lib/pricing";

const schema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      unitPriceCents: z.number(),
      quantity: z.number(),
      sizeDeltaCents: z.number().optional(),
    }),
  ),
  scope: z.enum(["service", "product"]).default("service"),
});

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await resolveBestAutomaticDiscount(
    parsed.data.items as PricingLineItem[],
    session?.user?.id,
    parsed.data.scope,
  );

  return NextResponse.json({ discount: result?.pricingDiscount ?? null });
}
