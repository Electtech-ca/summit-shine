import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MembershipManager } from "@/components/stripe/membership-manager";

export default async function AccountMembershipPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [membership, plans] = await Promise.all([
    prisma.membership.findUnique({ where: { userId: session.user.id }, include: { plan: true } }),
    prisma.membershipPlan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } }),
  ]);

  return (
    <MembershipManager
      publishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
      membership={membership}
      plans={plans}
    />
  );
}
