"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, ServiceCategory, SizeModifier, Vehicle, VehicleSize } from "@prisma/client";
import { calculatePricing, type PricingDiscount, type PricingLineItem } from "@/lib/pricing";
import { formatCentsToCAD } from "@/lib/format";
import type { BookingSettings } from "@/lib/booking-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceWithModifiers = Service & { sizeModifiers: SizeModifier[] };
type CategoryWithServices = ServiceCategory & { services: ServiceWithModifiers[] };

const SIZE_LABELS: Record<VehicleSize, string> = {
  SEDAN: "Sedan",
  SUV: "SUV / Crossover",
  TRUCK: "Truck / Van",
  OVERSIZED: "Oversized",
};

const STEPS = ["Services", "Vehicle", "Date & Time", "Details", "Review"] as const;

function todayISODate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function maxISODate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function BookingWizard({
  categories,
  vehicles,
  settings,
  isSignedIn,
  preselectedServiceSlug,
}: {
  categories: CategoryWithServices[];
  vehicles: Vehicle[];
  settings: BookingSettings;
  isSignedIn: boolean;
  preselectedServiceSlug?: string;
}) {
  const router = useRouter();
  const allServices = useMemo(() => categories.flatMap((c) => c.services), [categories]);

  const [step, setStep] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    const preselected = allServices.find((s) => s.slug === preselectedServiceSlug);
    return preselected ? [preselected.id] : [];
  });

  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id ?? "");
  const [manualSize, setManualSize] = useState<VehicleSize>("SEDAN");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<PricingDiscount | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ reference: string; totalCents: number } | null>(
    null,
  );

  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  const vehicleSize: VehicleSize = vehicleId
    ? (vehicles.find((v) => v.id === vehicleId)?.size ?? "SEDAN")
    : manualSize;

  const pricingItems: PricingLineItem[] = selectedServices.map((s) => {
    const modifier = s.sizeModifiers.find((m) => m.size === vehicleSize);
    return {
      id: s.id,
      name: s.name,
      unitPriceCents: s.salePriceCents ?? s.basePriceCents,
      quantity: 1,
      sizeDeltaCents: modifier?.deltaCents ?? 0,
    };
  });

  const pricing = calculatePricing(pricingItems, appliedDiscount, {
    gstPct: settings.gstPct,
    pstPct: settings.pstPct,
  });

  async function loadSlots(date: string) {
    if (selectedServices.length === 0) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/availability?date=${date}&durationMinutes=${totalDurationMinutes}`,
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function applyPromoCode() {
    setPromoError(null);
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), serviceIds: selectedServiceIds }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error ?? "Invalid promo code");
        setAppliedDiscount(null);
        return;
      }
      setAppliedDiscount(data.discount);
    } finally {
      setPromoChecking(false);
    }
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: selectedServiceIds.map((serviceId) => ({ serviceId, quantity: 1 })),
        vehicleId: vehicleId || undefined,
        vehicleSize: vehicleId ? undefined : manualSize,
        startsAt: selectedSlot,
        notes: notes || undefined,
        promoCode: appliedDiscount ? promoCode.trim() : undefined,
        guestName: isSignedIn ? undefined : guestName,
        guestEmail: isSignedIn ? undefined : guestEmail,
        guestPhone: isSignedIn ? undefined : guestPhone,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setConfirmation({ reference: data.reference, totalCents: data.totalCents });
  }

  if (confirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Confirmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg">
            Reference: <span className="font-mono font-semibold">{confirmation.reference}</span>
          </p>
          <p className="text-muted-foreground">
            Total due: {formatCentsToCAD(confirmation.totalCents)}
            {settings.payAtLocationEnabled ? " (pay at location, or online — coming soon)" : ""}
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              nativeButton={false}
              render={<a href="/account/bookings" />}
            >
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose your service(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category) =>
              category.services.length > 0 ? (
                <div key={category.id}>
                  <h3 className="mb-2 font-semibold">{category.name}</h3>
                  <div className="space-y-2">
                    {category.services.map((service) => (
                      <label
                        key={service.id}
                        className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                      >
                        <span className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedServiceIds.includes(service.id)}
                            onCheckedChange={(checked) => {
                              setSelectedServiceIds((prev) =>
                                checked
                                  ? [...prev, service.id]
                                  : prev.filter((id) => id !== service.id),
                              );
                            }}
                          />
                          <span>
                            {service.name}{" "}
                            <span className="text-sm text-muted-foreground">
                              ({service.durationMin} min)
                            </span>
                          </span>
                        </span>
                        <span className="font-medium">
                          {formatCentsToCAD(service.salePriceCents ?? service.basePriceCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-muted-foreground">
                Running subtotal ({selectedServices.length} selected)
              </span>
              <span className="font-display text-xl font-semibold text-primary">
                {formatCentsToCAD(pricing.subtotalCents)}
              </span>
            </div>
            <Button disabled={selectedServices.length === 0} onClick={() => setStep(1)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignedIn && vehicles.length > 0 && (
              <div className="space-y-2">
                <Label>Saved vehicle</Label>
                <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a saved vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} — {SIZE_LABELS[v.size]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!vehicleId && (
              <div className="space-y-2">
                <Label>Vehicle size</Label>
                <Select value={manualSize} onValueChange={(v) => setManualSize(v as VehicleSize)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isSignedIn && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">Booking as a guest</p>
                <div className="space-y-2">
                  <Label htmlFor="guestName">Name</Label>
                  <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input id="guestPhone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                disabled={!isSignedIn && (!guestName || !guestEmail)}
                onClick={() => {
                  setStep(2);
                  loadSlots(selectedDate);
                }}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a date &amp; time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={todayISODate()}
                max={maxISODate(settings.maxAdvanceBookingDays)}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadSlots(e.target.value);
                }}
              />
            </div>

            {slotsLoading && <p className="text-sm text-muted-foreground">Loading times...</p>}
            {!slotsLoading && slots?.length === 0 && (
              <p className="text-sm text-muted-foreground">No times available that day — try another date.</p>
            )}
            {!slotsLoading && slots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((iso) => {
                  const time = new Date(iso);
                  const label = time.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedSlot(iso)}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        selectedSlot === iso
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={!selectedSlot} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Details &amp; extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes for our team</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo">Promo code</Label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setAppliedDiscount(null);
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

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review &amp; confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span>{formatCentsToCAD(s.salePriceCents ?? s.basePriceCents)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground">
                <span>Vehicle size</span>
                <span>{SIZE_LABELS[vehicleSize]}</span>
              </div>
              {selectedSlot && (
                <div className="flex justify-between text-muted-foreground">
                  <span>When</span>
                  <span>
                    {new Date(selectedSlot).toLocaleString("en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4 text-sm">
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
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
