import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe-customer";
import { getBookingSettings } from "@/lib/booking-settings";
import { calculatePricing, type PricingLineItem } from "@/lib/pricing";
import { resolveDiscountByCode, resolveBestAutomaticDiscount } from "@/lib/discount-resolution";
import { checkoutSchema } from "@/lib/validations/cart";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!session?.user && !data.guestEmail) {
    return NextResponse.json({ error: "Enter your email to check out as a guest." }, { status: 400 });
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "One or more items are no longer available" }, { status: 400 });
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  for (const item of data.items) {
    const product = productById.get(item.productId)!;
    if (product.stockQty < item.quantity) {
      return NextResponse.json({ error: `${product.name} is out of stock` }, { status: 400 });
    }
  }

  const pricingItems: PricingLineItem[] = data.items.map((item) => {
    const product = productById.get(item.productId)!;
    return {
      id: product.id,
      name: product.name,
      unitPriceCents: product.salePriceCents ?? product.priceCents,
      quantity: item.quantity,
    };
  });

  let discountId: string | null = null;
  let pricingDiscount = null;
  if (data.promoCode) {
    const result = await resolveDiscountByCode(
      data.promoCode.trim().toUpperCase(),
      productIds,
      session?.user?.id,
      "product",
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    discountId = result.discountId;
    pricingDiscount = result.pricingDiscount;
  } else {
    const auto = await resolveBestAutomaticDiscount(pricingItems, session?.user?.id, "product");
    if (auto) {
      discountId = auto.discountId;
      pricingDiscount = auto.pricingDiscount;
    }
  }

  const settings = await getBookingSettings();
  const pricing = calculatePricing(pricingItems, pricingDiscount, {
    gstPct: settings.gstPct,
    pstPct: settings.pstPct,
  });

  try {
    const customerId = session?.user
      ? await getOrCreateStripeCustomerId(session.user.id)
      : undefined;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session?.user?.id,
          status: "PENDING",
          subtotalCents: pricing.subtotalCents,
          discountCents: pricing.discountCents,
          taxCents: pricing.taxCents,
          totalCents: pricing.totalCents,
          discountId,
          items: {
            create: data.items.map((item) => {
              const product = productById.get(item.productId)!;
              return {
                productId: product.id,
                qty: item.quantity,
                priceCents: product.salePriceCents ?? product.priceCents,
              };
            }),
          },
        },
      });

      if (discountId) {
        await tx.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
      }

      return created;
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.totalCents,
      currency: "cad",
      customer: customerId,
      receipt_email: data.guestEmail,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({ orderId: order.id, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return handleApiError(err);
  }
}
