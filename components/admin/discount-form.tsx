"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Discount, DiscountType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function DiscountForm({ discount }: { discount?: Discount }) {
  const router = useRouter();
  const [name, setName] = useState(discount?.name ?? "");
  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState<DiscountType>(discount?.type ?? "PERCENTAGE");
  const [valuePct, setValuePct] = useState(discount?.valuePct ?? 10);
  const [valueCents, setValueCents] = useState((discount?.valueCents ?? 0) / 100);
  const [minSpendCents, setMinSpendCents] = useState(
    discount?.minSpendCents != null ? discount.minSpendCents / 100 : "",
  );
  const [startsAt, setStartsAt] = useState(toDateInputValue(discount?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInputValue(discount?.endsAt));
  const [maxUses, setMaxUses] = useState(discount?.maxUses ?? "");
  const [usesPerCustomer, setUsesPerCustomer] = useState(discount?.usesPerCustomer ?? "");
  const [stackable, setStackable] = useState(discount?.stackable ?? false);
  const [active, setActive] = useState(discount?.active ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      code: code || null,
      type,
      valuePct: type === "PERCENTAGE" ? Number(valuePct) : null,
      valueCents: type === "FIXED" ? Math.round(Number(valueCents) * 100) : null,
      minSpendCents: minSpendCents === "" ? null : Math.round(Number(minSpendCents) * 100),
      appliesToServiceIds: [],
      appliesToProductIds: [],
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      maxUses: maxUses === "" ? null : Number(maxUses),
      usesPerCustomer: usesPerCustomer === "" ? null : Number(usesPerCustomer),
      stackable,
      active,
    };

    const url = discount ? `/api/admin/discounts/${discount.id}` : "/api/admin/discounts";
    const res = await fetch(url, {
      method: discount ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/admin/discounts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code (leave blank for automatic promotion)</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
            <SelectTrigger id="type">
              <SelectValue>
                {(v: DiscountType) => (v === "PERCENTAGE" ? "Percentage" : "Fixed Amount")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="FIXED">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === "PERCENTAGE" ? (
          <div className="space-y-2">
            <Label htmlFor="valuePct">Percent Off</Label>
            <Input
              id="valuePct"
              type="number"
              min={0}
              max={100}
              value={valuePct}
              onChange={(e) => setValuePct(Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="valueCents">Amount Off (CAD)</Label>
            <Input
              id="valueCents"
              type="number"
              min={0}
              step="0.01"
              value={valueCents}
              onChange={(e) => setValueCents(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="minSpend">Minimum Spend (CAD, optional)</Label>
        <Input
          id="minSpend"
          type="number"
          min={0}
          step="0.01"
          value={minSpendCents}
          onChange={(e) => setMinSpendCents(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts</Label>
          <Input id="startsAt" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input id="endsAt" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxUses">Max Total Uses</Label>
          <Input
            id="maxUses"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usesPerCustomer">Max Uses Per Customer</Label>
          <Input
            id="usesPerCustomer"
            type="number"
            min={1}
            value={usesPerCustomer}
            onChange={(e) => setUsesPerCustomer(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="stackable" checked={stackable} onCheckedChange={setStackable} />
          <Label htmlFor="stackable">Stackable</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : discount ? "Save Changes" : "Create Discount"}
      </Button>
    </form>
  );
}
