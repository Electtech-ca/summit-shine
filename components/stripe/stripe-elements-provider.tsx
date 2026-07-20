"use client";

import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

export function StripeElementsProvider({
  publishableKey,
  clientSecret,
  children,
}: {
  publishableKey: string;
  clientSecret: string;
  children: React.ReactNode;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}
