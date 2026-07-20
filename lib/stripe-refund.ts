import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function refundBooking(bookingId: string, amountCents?: number) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (!booking.stripePaymentIntentId) {
    throw new Error("This booking has no payment to refund");
  }

  const refund = await stripe.refunds.create({
    payment_intent: booking.stripePaymentIntentId,
    amount: amountCents,
  });

  const fullyRefunded = !amountCents || amountCents >= booking.totalCents;
  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });

  return refund;
}
