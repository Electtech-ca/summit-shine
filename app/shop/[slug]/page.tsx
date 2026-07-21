import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { active: true }, select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });

  if (!product || !product.active) notFound();

  const onSale = product.salePriceCents != null && product.salePriceCents < product.priceCents;
  const displayPrice = onSale ? product.salePriceCents! : product.priceCents;
  const outOfStock = product.stockQty <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="mb-2 text-sm text-muted-foreground">
        <Link href="/services" className="hover:text-primary">
          Services &amp; Products
        </Link>{" "}
        / Shop
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {product.images[0] && (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
          )}
          {onSale && (
            <Badge className="absolute right-3 top-3 bg-destructive text-white">Sale</Badge>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCentsToCAD(product.priceCents)}
              </span>
            )}
            <span className="font-display text-3xl font-semibold text-primary">
              {formatCentsToCAD(displayPrice)}
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {outOfStock ? "Out of stock" : "In stock, ready for pickup"}
          </p>

          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              priceCents={product.priceCents}
              salePriceCents={product.salePriceCents}
              image={product.images[0]}
              outOfStock={outOfStock}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
