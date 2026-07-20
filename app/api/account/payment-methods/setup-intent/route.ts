import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe-customer";
import { handleApiError } from "@/lib/api-error";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customerId = await getOrCreateStripeCustomerId(session.user.id);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    return handleApiError(err);
  }
}
