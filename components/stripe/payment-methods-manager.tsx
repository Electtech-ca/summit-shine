"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StripeElementsProvider } from "@/components/stripe/stripe-elements-provider";
import { StripeSetupForm } from "@/components/stripe/stripe-setup-form";

type PaymentMethod = {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
};

async function fetchPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[]; defaultId: string | null }> {
  const res = await fetch("/api/account/payment-methods");
  if (!res.ok) throw new Error("Failed to load payment methods");
  return res.json();
}

export function PaymentMethodsManager({ publishableKey }: { publishableKey: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["payment-methods"], queryFn: fetchPaymentMethods });
  const [addingCard, setAddingCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/account/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove card");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  async function startAddCard() {
    setAddingCard(true);
    setError(null);
    const res = await fetch("/api/account/payment-methods/setup-intent", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not start card setup. Please try again.");
      setAddingCard(false);
      return;
    }
    setClientSecret(data.clientSecret);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Methods</CardTitle>
        {!addingCard && (
          <Button size="sm" onClick={startAddCard}>
            Add Card
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && data?.paymentMethods.length === 0 && !addingCard && (
          <p className="text-sm text-muted-foreground">No saved cards yet.</p>
        )}
        {data?.paymentMethods.map((pm) => (
          <div key={pm.id} className="flex items-center justify-between rounded-md border border-border p-3">
            <span className="text-sm capitalize">
              {pm.brand} •••• {pm.last4}{" "}
              <span className="text-muted-foreground">
                {pm.expMonth}/{pm.expYear}
              </span>
              {pm.id === data.defaultId && <span className="ml-2 text-xs text-accent">Default</span>}
            </span>
            <Button variant="ghost" size="sm" onClick={() => deleteMethod.mutate(pm.id)}>
              Remove
            </Button>
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {addingCard && clientSecret && (
          <div className="border-t pt-4">
            <StripeElementsProvider publishableKey={publishableKey} clientSecret={clientSecret}>
              <StripeSetupForm
                returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/account/payment-methods`}
                onSuccess={() => {
                  setAddingCard(false);
                  setClientSecret(null);
                  queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
                }}
              />
            </StripeElementsProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
