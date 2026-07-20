import { prisma } from "@/lib/prisma";

/** The member's detailing-discount percentage from their active plan, or 0 if none. */
export async function getMemberDetailDiscountPct(userId: string | undefined): Promise<number> {
  if (!userId) return 0;

  const membership = await prisma.membership.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!membership || membership.status !== "active") return 0;
  return membership.plan.detailDiscountPct;
}
