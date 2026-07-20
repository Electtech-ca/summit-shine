"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, ServiceCategory, VehicleSize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryWithServices = ServiceCategory & { services: Service[] };

const SIZE_LABELS: Record<VehicleSize, string> = {
  SEDAN: "Sedan",
  SUV: "SUV / Crossover",
  TRUCK: "Truck / Van",
  OVERSIZED: "Oversized",
};

export function WalkInForm({ categories }: { categories: CategoryWithServices[] }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>("SEDAN");
  const [markPaid, setMarkPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/bookings/walk-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName, serviceIds, vehicleSize, markPaid }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setGuestName("");
    setServiceIds([]);
    setMarkPaid(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="walkInName">Customer Name</Label>
          <Input id="walkInName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="walkInSize">Vehicle Size</Label>
          <Select value={vehicleSize} onValueChange={(v) => setVehicleSize(v as VehicleSize)}>
            <SelectTrigger id="walkInSize">
              <SelectValue>{(v: VehicleSize) => SIZE_LABELS[v]}</SelectValue>
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
      </div>

      <div className="space-y-2">
        <Label>Services</Label>
        <div className="flex flex-wrap gap-3">
          {categories.flatMap((c) => c.services).map((service) => (
            <label key={service.id} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={serviceIds.includes(service.id)}
                onCheckedChange={(checked) =>
                  setServiceIds((prev) =>
                    checked ? [...prev, service.id] : prev.filter((id) => id !== service.id),
                  )
                }
              />
              {service.name}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-1.5 text-sm">
        <Checkbox checked={markPaid} onCheckedChange={(c) => setMarkPaid(c === true)} />
        Mark as paid now
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || serviceIds.length === 0}>
        {submitting ? "Adding..." : "Add Walk-in Booking"}
      </Button>
    </form>
  );
}
