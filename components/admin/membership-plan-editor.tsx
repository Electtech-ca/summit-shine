"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipPlan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MembershipPlanEditor({ plan }: { plan: MembershipPlan }) {
  const router = useRouter();
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [priceCents, setPriceCents] = useState(plan.priceCents / 100);
  const [perks, setPerks] = useState(plan.perks.join("\n"));
  const [detailDiscountPct, setDetailDiscountPct] = useState(plan.detailDiscountPct);
  const [active, setActive] = useState(plan.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/admin/membership-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        priceCents: Math.round(Number(priceCents) * 100),
        interval: plan.interval,
        perks: perks.split("\n").map((p) => p.trim()).filter(Boolean),
        detailDiscountPct: Number(detailDiscountPct),
        active,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save changes.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price (CAD/{plan.interval})</Label>
            <Input
              type="number"
              step="0.01"
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Detailing Discount %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={detailDiscountPct}
              onChange={(e) => setDetailDiscountPct(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Perks (one per line)</Label>
          <Textarea value={perks} onChange={(e) => setPerks(e.target.value)} rows={4} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Active</Label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
