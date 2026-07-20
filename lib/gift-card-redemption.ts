import { prisma } from "@/lib/prisma";

export type GiftCardRedemption = { redeemedCents: number; giftCardId: string } | { error: string };

/** Deducts up to amountCents from a gift card's balance and returns how much was actually redeemed. */
export async function redeemGiftCard(code: string, amountCents: number): Promise<GiftCardRedemption> {
  const giftCard = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!giftCard || !giftCard.active) return { error: "Invalid gift card code" };
  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) return { error: "This gift card has expired" };
  if (giftCard.balanceCents <= 0) return { error: "This gift card has no remaining balance" };

  const redeemedCents = Math.min(giftCard.balanceCents, amountCents);
  await prisma.giftCard.update({
    where: { id: giftCard.id },
    data: { balanceCents: { decrement: redeemedCents } },
  });

  return { redeemedCents, giftCardId: giftCard.id };
}

/** Restores a redeemed amount, e.g. if a later step in the same checkout fails. */
export async function refundGiftCardRedemption(giftCardId: string, cents: number): Promise<void> {
  if (cents <= 0) return;
  await prisma.giftCard.update({
    where: { id: giftCardId },
    data: { balanceCents: { increment: cents } },
  });
}
