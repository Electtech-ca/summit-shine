import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountMembershipPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Membership plans, saved cards, and billing self-serve will appear here once Stripe
          Subscriptions are wired up.
        </p>
      </CardContent>
    </Card>
  );
}
