import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveDiscountByCode } from "@/lib/discount-resolution";

const schema = z.object({
  code: z.string().min(1),
  serviceIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await resolveDiscountByCode(
    parsed.data.code.trim().toUpperCase(),
    parsed.data.serviceIds,
    session?.user?.id,
  );

  if (!result.ok) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
  }

  return NextResponse.json({ valid: true, discount: result.pricingDiscount });
}
