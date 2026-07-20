import Image from "next/image";
import Link from "next/link";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProductCardProps = {
  slug: string;
  name: string;
  image?: string;
  priceCents: number;
  salePriceCents?: number | null;
  stockQty: number;
};

export function ProductCard({
  slug,
  name,
  image,
  priceCents,
  salePriceCents,
  stockQty,
}: ProductCardProps) {
  const onSale = salePriceCents != null && salePriceCents < priceCents;
  const outOfStock = stockQty <= 0;

  return (
    <Link href={`/shop/${slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {image && (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {onSale && (
            <Badge className="absolute right-2 top-2 bg-destructive text-white">Sale</Badge>
          )}
          {outOfStock && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              Out of Stock
            </Badge>
          )}
        </div>
        <CardContent className="space-y-2 pt-4">
          <h3 className="font-display text-base font-semibold">{name}</h3>
          <div className="flex items-center gap-2">
            {onSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCentsToCAD(priceCents)}
              </span>
            )}
            <span className="font-semibold text-primary">
              {formatCentsToCAD(onSale ? salePriceCents! : priceCents)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
