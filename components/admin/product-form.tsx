"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.images[0] ?? "");
  const [priceCents, setPriceCents] = useState((product?.priceCents ?? 0) / 100);
  const [salePriceCents, setSalePriceCents] = useState(
    product?.salePriceCents != null ? product.salePriceCents / 100 : "",
  );
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stockQty, setStockQty] = useState(product?.stockQty ?? 0);
  const [lowStockAt, setLowStockAt] = useState(product?.lowStockAt ?? 5);
  const [active, setActive] = useState(product?.active ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      slug,
      description,
      images: imageUrl ? [imageUrl] : [],
      priceCents: Math.round(Number(priceCents) * 100),
      salePriceCents: salePriceCents === "" ? null : Math.round(Number(salePriceCents) * 100),
      sku: sku || null,
      stockQty: Number(stockQty),
      lowStockAt: Number(lowStockAt),
      active,
    };

    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/admin/products");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (CAD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            value={priceCents}
            onChange={(e) => setPriceCents(Number(e.target.value))}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockQty">Stock Qty</Label>
          <Input
            id="stockQty"
            type="number"
            min={0}
            value={stockQty}
            onChange={(e) => setStockQty(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStockAt">Low Stock Threshold</Label>
          <Input
            id="lowStockAt"
            type="number"
            min={0}
            value={lowStockAt}
            onChange={(e) => setLowStockAt(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="active" checked={active} onCheckedChange={setActive} />
        <Label htmlFor="active">Active</Label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : product ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}
