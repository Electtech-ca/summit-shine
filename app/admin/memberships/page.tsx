import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MembershipPlanEditor } from "@/components/admin/membership-plan-editor";
import { MembersList } from "@/components/admin/members-list";

export default async function AdminMembershipsPage() {
  const [plans, members] = await Promise.all([
    prisma.membershipPlan.findMany({ orderBy: { priceCents: "asc" } }),
    prisma.membership.findMany({
      include: { user: true, plan: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Memberships</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <MembershipPlanEditor key={plan.id} plan={plan} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <MembersList members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
