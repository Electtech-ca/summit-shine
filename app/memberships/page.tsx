import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export const metadata = {
  title: "Memberships | Summit Shine Car Wash & Detail Co.",
  description: "Unlimited washes and detailing discounts with a Summit Shine membership plan.",
};

export default async function MembershipsPage() {
  const plans = await prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: { priceCents: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-semibold text-primary">Memberships</h1>
        <p className="mt-2 text-muted-foreground">
          Unlimited washes, member pricing, and a card on file for one-click booking.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, i) => (
          <Card key={plan.id} className={i === 1 ? "border-primary shadow-md" : undefined}>
            <CardHeader>
              <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                <span className="font-display text-3xl font-semibold text-primary">
                  {formatCentsToCAD(plan.priceCents)}
                </span>
                <span className="text-muted-foreground"> /{plan.interval}</span>
              </p>
              <ul className="space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                nativeButton={false}
                render={<Link href={`/account/membership?plan=${plan.id}`} />}
              >
                Join {plan.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
