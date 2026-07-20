import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) return NextResponse.json({ paymentMethods: [], defaultId: null });

  try {
    const [paymentMethods, customer] = await Promise.all([
      stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" }),
      stripe.customers.retrieve(user.stripeCustomerId),
    ]);

    const defaultId =
      !customer.deleted && typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : null;

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
      defaultId,
    });
  } catch {
    return NextResponse.json({ paymentMethods: [], defaultId: null });
  }
}
