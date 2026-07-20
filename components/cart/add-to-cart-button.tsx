"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  slug,
  name,
  priceCents,
  salePriceCents,
  image,
  outOfStock,
}: {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  salePriceCents?: number | null;
  image?: string;
  outOfStock: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size="lg"
      disabled={outOfStock}
      onClick={() => {
        addItem({ productId, slug, name, priceCents, salePriceCents, image });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {outOfStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
    </Button>
  );
}
