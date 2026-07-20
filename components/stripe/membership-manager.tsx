"use client";

import { useState } from "react";
import type { Membership, MembershipPlan } from "@prisma/client";
import { formatCentsToCAD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeElementsProvider } from "@/components/stripe/stripe-elements-provider";
import { StripeSetupForm } from "@/components/stripe/stripe-setup-form";

type MembershipWithPlan = Membership & { plan: MembershipPlan };

export function MembershipManager({
  publishableKey,
  membership,
  plans,
}: {
  publishableKey: string;
  membership: MembershipWithPlan | null;
  plans: MembershipPlan[];
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  async function openBillingPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/account/membership/portal", { method: "POST" });
    const data = await res.json();
    setPortalLoading(false);
    if (data.url) window.location.href = data.url;
  }

  async function startPlanSignup(planId: string) {
    setSelectedPlanId(planId);
    setError(null);
    setClientSecret(null);
    const res = await fetch("/api/account/payment-methods/setup-intent", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not start checkout. Please try again.");
      return;
    }
    setClientSecret(data.clientSecret);
  }

  async function completeSubscription(paymentMethodId: string) {
    if (!selectedPlanId) return;
    setSubscribing(true);
    setError(null);

    const res = await fetch("/api/account/membership/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlanId, paymentMethodId }),
    });

    setSubscribing(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not start your membership. Please try again.");
      return;
    }

    setSubscribed(true);
  }

  if (membership && (membership.status === "active" || membership.status === "trialing")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-display text-xl font-semibold">{membership.plan.name}</p>
            <p className="text-muted-foreground">
              {formatCentsToCAD(membership.plan.priceCents)}/{membership.plan.interval}
            </p>
            {membership.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews {new Date(membership.currentPeriodEnd).toLocaleDateString("en-CA", { dateStyle: "medium" })}
              </p>
            )}
          </div>
          <Button onClick={openBillingPortal} disabled={portalLoading}>
            {portalLoading ? "Opening..." : "Manage Billing"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (subscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-accent">Your membership is active. Welcome to Summit Shine!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a Membership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {membership && membership.status !== "active" && membership.status !== "trialing" && (
          <p className="text-sm text-muted-foreground">
            Your previous membership is {membership.status}. Choose a plan below to resubscribe.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => startPlanSignup(plan.id)}
              className={`rounded-lg border p-4 text-left ${
                selectedPlanId === plan.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <p className="font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCentsToCAD(plan.priceCents)}/{plan.interval}
              </p>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {clientSecret && (
          <div className="border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Add a card to complete your {plans.find((p) => p.id === selectedPlanId)?.name} membership.
            </p>
            <StripeElementsProvider publishableKey={publishableKey} clientSecret={clientSecret}>
              <StripeSetupForm
                submitLabel={subscribing ? "Starting membership..." : "Start Membership"}
                returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/account/membership`}
                onSuccess={completeSubscription}
              />
            </StripeElementsProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
