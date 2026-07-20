import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateGiftCardCode } from "@/lib/gift-card-code";

function subscriptionCurrentPeriodEnd(sub: Stripe.Subscription): Date | undefined {
  const end = sub.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : undefined;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const details = invoice.parent?.subscription_details;
  if (!details?.subscription) return undefined;
  return typeof details.subscription === "string" ? details.subscription : details.subscription.id;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;

      if (pi.metadata?.type === "gift_card") {
        await prisma.giftCard.create({
          data: {
            code: generateGiftCardCode(),
            initialCents: Number(pi.metadata.amountCents),
            balanceCents: Number(pi.metadata.amountCents),
            purchaserEmail: pi.metadata.purchaserEmail,
          },
        });
      } else if (pi.metadata?.bookingId) {
        await prisma.booking.update({
          where: { id: pi.metadata.bookingId },
          data: { paymentStatus: "PAID", status: "CONFIRMED" },
        });
      } else if (pi.metadata?.orderId) {
        await prisma.order.update({
          where: { id: pi.metadata.orderId },
          data: { status: "PAID" },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      // No local state to roll back — the booking/order was already created
      // as PENDING/UNPAID and simply stays that way until retried.
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId) {
        await prisma.membership.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: "active" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId) {
        await prisma.membership.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: "past_due" },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const currentPeriodEnd = subscriptionCurrentPeriodEnd(sub);
      await prisma.membership.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: sub.status, ...(currentPeriodEnd ? { currentPeriodEnd } : {}) },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.membership.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "canceled" },
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });
        if (booking) {
          const fullyRefunded = charge.amount_refunded >= charge.amount;
          await prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
