"use client";

import { useState } from "react";
import { formatCentsToCAD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeElementsProvider } from "@/components/stripe/stripe-elements-provider";
import { StripePaymentForm } from "@/components/stripe/stripe-payment-form";

const PRESET_AMOUNTS_CENTS = [2500, 5000, 10000];

export function GiftCardPurchase({
  publishableKey,
  defaultEmail,
}: {
  publishableKey: string;
  defaultEmail: string;
}) {
  const [amountCents, setAmountCents] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const effectiveAmountCents = customAmount ? Math.round(Number(customAmount) * 100) : amountCents;

  async function startCheckout() {
    setError(null);
    if (!email) {
      setError("Enter your email to receive the gift card.");
      return;
    }
    if (!effectiveAmountCents || effectiveAmountCents < 500) {
      setError("Minimum gift card amount is $5.");
      return;
    }

    const res = await fetch("/api/gift-cards/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: effectiveAmountCents, purchaserEmail: email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setClientSecret(data.clientSecret);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-accent">
            Payment received! Your gift card code will be emailed to {email} shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy a Gift Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setAmountCents(cents);
                setCustomAmount("");
              }}
              className={`rounded-md border py-2 text-sm font-medium ${
                amountCents === cents && !customAmount
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {formatCentsToCAD(cents)}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customAmount">Custom amount (CAD)</Label>
          <Input
            id="customAmount"
            type="number"
            min={5}
            step="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="e.g. 75"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Your email (for delivery)</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!clientSecret && (
          <Button className="w-full" onClick={startCheckout}>
            Continue to Payment — {formatCentsToCAD(effectiveAmountCents || 0)}
          </Button>
        )}

        {clientSecret && (
          <div className="border-t pt-4">
            <StripeElementsProvider publishableKey={publishableKey} clientSecret={clientSecret}>
              <StripePaymentForm
                returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/gift-cards`}
                onSuccess={() => setSuccess(true)}
              />
            </StripeElementsProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
