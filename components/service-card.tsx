import Image from "next/image";
import Link from "next/link";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ServiceCardProps = {
  slug: string;
  name: string;
  description: string;
  image?: string;
  durationMin: number;
  basePriceCents: number;
  salePriceCents?: number | null;
  featured?: boolean;
};

export function ServiceCard({
  slug,
  name,
  description,
  image,
  durationMin,
  basePriceCents,
  salePriceCents,
  featured,
}: ServiceCardProps) {
  const onSale = salePriceCents != null && salePriceCents < basePriceCents;

  return (
    <Link href={`/services/${slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {image && (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {featured && (
            <Badge className="absolute left-2 top-2 bg-cedar text-white">Featured</Badge>
          )}
          {onSale && (
            <Badge className="absolute right-2 top-2 bg-destructive text-white">Sale</Badge>
          )}
        </div>
        <CardContent className="space-y-2 pt-4">
          <h3 className="font-display text-lg font-semibold">{name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{durationMin} min</span>
            <div className="flex items-center gap-2">
              {onSale && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCentsToCAD(basePriceCents)}
                </span>
              )}
              <span className="font-semibold text-primary">
                {formatCentsToCAD(onSale ? salePriceCents! : basePriceCents)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
