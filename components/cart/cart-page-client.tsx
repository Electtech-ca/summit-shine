"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { calculatePricing, type PricingDiscount, type PricingLineItem } from "@/lib/pricing";
import { formatCentsToCAD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeElementsProvider } from "@/components/stripe/stripe-elements-provider";
import { StripePaymentForm } from "@/components/stripe/stripe-payment-form";

export function CartPageClient({
  isSignedIn,
  defaultEmail,
  gstPct,
  pstPct,
  publishableKey,
}: {
  isSignedIn: boolean;
  defaultEmail: string;
  gstPct: number;
  pstPct: number;
  publishableKey: string;
}) {
  const { items, setQuantity, removeItem, clear } = useCart();

  const [guestEmail, setGuestEmail] = useState(defaultEmail);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<PricingDiscount | null>(null);
  const [isManualDiscount, setIsManualDiscount] = useState(false);

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const pricingItems: PricingLineItem[] = items.map((item) => ({
    id: item.productId,
    name: item.name,
    unitPriceCents: item.salePriceCents ?? item.priceCents,
    quantity: item.quantity,
  }));

  const pricing = calculatePricing(pricingItems, appliedDiscount, { gstPct, pstPct });

  async function applyPromoCode() {
    setPromoError(null);
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          serviceIds: items.map((i) => i.productId),
          scope: "product",
        }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error ?? "Invalid promo code");
        setAppliedDiscount(null);
        setIsManualDiscount(false);
        return;
      }
      setAppliedDiscount(data.discount);
      setIsManualDiscount(true);
    } finally {
      setPromoChecking(false);
    }
  }

  async function handleCheckout() {
    setCheckoutError(null);
    if (!isSignedIn && !guestEmail) {
      setCheckoutError("Enter your email to check out as a guest.");
      return;
    }
    setCheckingOut(true);

    const res = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        promoCode: isManualDiscount && appliedDiscount ? promoCode.trim() : undefined,
        guestEmail: isSignedIn ? undefined : guestEmail,
      }),
    });

    const data = await res.json();
    setCheckingOut(false);

    if (!res.ok) {
      setCheckoutError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setClientSecret(data.clientSecret);
  }

  if (paymentDone) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-accent">Payment received — thanks for your order!</p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/services" />}>
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pay {formatCentsToCAD(pricing.totalCents)}</CardTitle>
        </CardHeader>
        <CardContent>
          <StripeElementsProvider publishableKey={publishableKey} clientSecret={clientSecret}>
            <StripePaymentForm
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/cart`}
              onSuccess={() => {
                clear();
                setPaymentDone(true);
              }}
            />
          </StripeElementsProvider>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your cart is empty.{" "}
        <Link href="/services" className="text-primary hover:underline">
          Browse products
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCentsToCAD(item.salePriceCents ?? item.priceCents)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                className="w-16"
              />
              <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!isSignedIn && (
        <div className="space-y-2">
          <Label htmlFor="guestEmail">Email (for receipt)</Label>
          <Input
            id="guestEmail"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cartPromo">Promo code</Label>
        <div className="flex gap-2">
          <Input
            id="cartPromo"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value);
              setAppliedDiscount(null);
              setIsManualDiscount(false);
              setPromoError(null);
            }}
            placeholder="WELCOME10"
          />
          <Button type="button" variant="outline" onClick={applyPromoCode} disabled={promoChecking}>
            {promoChecking ? "Checking..." : "Apply"}
          </Button>
        </div>
        {promoError && <p className="text-sm text-destructive">{promoError}</p>}
        {appliedDiscount && !promoError && (
          <p className="text-sm text-accent">Promo code applied.</p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-1 pt-6 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCentsToCAD(pricing.subtotalCents)}</span>
          </div>
          {pricing.discountCents > 0 && (
            <div className="flex justify-between text-accent">
              <span>Discount</span>
              <span>-{formatCentsToCAD(pricing.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST + PST</span>
            <span>{formatCentsToCAD(pricing.taxCents)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span>{formatCentsToCAD(pricing.totalCents)}</span>
          </div>
        </CardContent>
      </Card>

      {checkoutError && <p className="text-sm text-destructive">{checkoutError}</p>}

      <Button className="w-full" onClick={handleCheckout} disabled={checkingOut}>
        {checkingOut ? "Preparing checkout..." : "Checkout"}
      </Button>
    </div>
  );
}
