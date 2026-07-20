"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

export function StripeSetupForm({
  returnUrl,
  onSuccess,
  submitLabel = "Save Card",
}: {
  returnUrl: string;
  onSuccess?: (paymentMethodId: string) => void;
  submitLabel?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (confirmError) {
      setError(confirmError.message ?? "Could not save card. Please try again.");
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string" ? setupIntent.payment_method : undefined;
    if (setupIntent?.status === "succeeded" && paymentMethodId) {
      onSuccess?.(paymentMethodId);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
