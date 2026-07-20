import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(params.id);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await stripe.paymentMethods.detach(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
