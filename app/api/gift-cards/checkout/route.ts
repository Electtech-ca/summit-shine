import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe-customer";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  amountCents: z.number().int().min(500).max(100000), // $5 - $1000
  purchaserEmail: z.string().email(),
});

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const customerId = session?.user
      ? await getOrCreateStripeCustomerId(session.user.id)
      : undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsed.data.amountCents,
      currency: "cad",
      customer: customerId,
      receipt_email: parsed.data.purchaserEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "gift_card",
        amountCents: String(parsed.data.amountCents),
        purchaserEmail: parsed.data.purchaserEmail,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return handleApiError(err);
  }
}
