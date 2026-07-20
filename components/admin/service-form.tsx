"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, ServiceCategory, SizeModifier, VehicleSize } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceWithModifiers = Service & { sizeModifiers: SizeModifier[] };

const SIZES: VehicleSize[] = ["SEDAN", "SUV", "TRUCK", "OVERSIZED"];
const SIZE_LABELS: Record<VehicleSize, string> = {
  SEDAN: "Sedan",
  SUV: "SUV / Crossover",
  TRUCK: "Truck / Van",
  OVERSIZED: "Oversized",
};

export function ServiceForm({
  service,
  categories,
}: {
  service?: ServiceWithModifiers;
  categories: ServiceCategory[];
}) {
  const router = useRouter();
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [imageUrl, setImageUrl] = useState(service?.images[0] ?? "");
  const [durationMin, setDurationMin] = useState(service?.durationMin ?? 30);
  const [basePriceCents, setBasePriceCents] = useState((service?.basePriceCents ?? 0) / 100);
  const [salePriceCents, setSalePriceCents] = useState(
    service?.salePriceCents != null ? service.salePriceCents / 100 : "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [featured, setFeatured] = useState(service?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(service?.sortOrder ?? 0);
  const [modifiers, setModifiers] = useState<Record<VehicleSize, number>>(() => {
    const map = { SEDAN: 0, SUV: 0, TRUCK: 0, OVERSIZED: 0 } as Record<VehicleSize, number>;
    for (const m of service?.sizeModifiers ?? []) map[m.size] = m.deltaCents / 100;
    return map;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      categoryId,
      name,
      slug,
      description,
      images: imageUrl ? [imageUrl] : [],
      durationMin: Number(durationMin),
      basePriceCents: Math.round(Number(basePriceCents) * 100),
      salePriceCents: salePriceCents === "" ? null : Math.round(Number(salePriceCents) * 100),
      active,
      featured,
      sortOrder: Number(sortOrder),
      sizeModifiers: SIZES.filter((s) => modifiers[s] !== 0).map((s) => ({
        size: s,
        deltaCents: Math.round(modifiers[s] * 100),
      })),
    };

    const url = service ? `/api/admin/services/${service.id}` : "/api/admin/services";
    const res = await fetch(url, {
      method: service ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/admin/services");
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
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
          <SelectTrigger id="category">
            <SelectValue>
              {(id: string) => categories.find((c) => c.id === id)?.name ?? "Select a category"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (min)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base Price (CAD)</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            min={0}
            value={basePriceCents}
            onChange={(e) => setBasePriceCents(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice">Sale Price (CAD)</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            min={0}
            value={salePriceCents}
            onChange={(e) => setSalePriceCents(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="None"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Vehicle Size Modifiers (CAD, added to base price)</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SIZES.map((size) => (
            <div key={size} className="space-y-1">
              <Label htmlFor={`mod-${size}`} className="text-xs text-muted-foreground">
                {SIZE_LABELS[size]}
              </Label>
              <Input
                id={`mod-${size}`}
                type="number"
                step="0.01"
                value={modifiers[size]}
                onChange={(e) => setModifiers((prev) => ({ ...prev, [size]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sortOrder" className="text-sm">
            Sort order
          </Label>
          <Input
            id="sortOrder"
            type="number"
            className="w-20"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : service ? "Save Changes" : "Create Service"}
      </Button>
    </form>
  );
}
