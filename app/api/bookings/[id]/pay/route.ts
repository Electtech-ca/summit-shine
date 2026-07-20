import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe-customer";
import { redeemGiftCard, refundGiftCardRedemption } from "@/lib/gift-card-redemption";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  mode: z.enum(["full", "deposit"]).default("full"),
  savedPaymentMethodId: z.string().optional(),
  giftCardCode: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  // Guest bookings (userId === null) have no session to check against; the
  // reference number itself is the only credential a guest has.
  if (booking.userId && booking.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (booking.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This booking is already paid" }, { status: 400 });
  }

  let amountCents = parsed.data.mode === "deposit" ? booking.depositCents : booking.totalCents;
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Nothing to charge" }, { status: 400 });
  }

  let giftCardId: string | null = null;
  let giftCardRedeemedCents = 0;
  if (parsed.data.giftCardCode) {
    const result = await redeemGiftCard(parsed.data.giftCardCode, amountCents);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    giftCardId = result.giftCardId;
    giftCardRedeemedCents = result.redeemedCents;
    amountCents -= giftCardRedeemedCents;
  }

  if (amountCents <= 0) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    return NextResponse.json({ status: "succeeded", giftCardRedeemedCents, fullyPaidByGiftCard: true });
  }

  try {
    const customerId = session?.user
      ? await getOrCreateStripeCustomerId(session.user.id)
      : undefined;

    if (parsed.data.savedPaymentMethodId && customerId) {
      // One-click confirm with a saved card.
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "cad",
        customer: customerId,
        payment_method: parsed.data.savedPaymentMethodId,
        off_session: true,
        confirm: true,
        metadata: { bookingId: booking.id, bookingReference: booking.reference },
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      return NextResponse.json({
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        giftCardRedeemedCents,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: booking.id, bookingReference: booking.reference },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, giftCardRedeemedCents });
  } catch (err) {
    if (giftCardId) await refundGiftCardRedemption(giftCardId, giftCardRedeemedCents);
    return handleApiError(err);
  }
}
