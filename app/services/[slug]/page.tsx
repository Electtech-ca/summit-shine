import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SIZE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV / Crossover",
  TRUCK: "Truck / Van",
  OVERSIZED: "Oversized",
};

export async function generateStaticParams() {
  const services = await prisma.service.findMany({ where: { active: true }, select: { slug: true } });
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await prisma.service.findUnique({ where: { slug: params.slug } });
  if (!service) return {};

  return {
    title: service.name,
    description: service.description,
    openGraph: {
      title: service.name,
      description: service.description,
      images: service.images[0] ? [service.images[0]] : undefined,
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
    include: { category: true, sizeModifiers: true },
  });

  if (!service || !service.active) notFound();

  const onSale = service.salePriceCents != null && service.salePriceCents < service.basePriceCents;
  const displayPrice = onSale ? service.salePriceCents! : service.basePriceCents;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="mb-2 text-sm text-muted-foreground">
        <Link href="/services" className="hover:text-primary">
          Services
        </Link>{" "}
        / {service.category.name}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {service.images[0] && (
            <Image src={service.images[0]} alt={service.name} fill className="object-cover" />
          )}
          {service.featured && (
            <Badge className="absolute left-3 top-3 bg-cedar text-white">Featured</Badge>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">{service.name}</h1>
          <p className="mt-3 text-muted-foreground">{service.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCentsToCAD(service.basePriceCents)}
              </span>
            )}
            <span className="font-display text-3xl font-semibold text-primary">
              {formatCentsToCAD(displayPrice)}
            </span>
            {onSale && <Badge className="bg-destructive text-white">Sale</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{service.durationMin} minutes · sedan base price</p>

          {service.sizeModifiers.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Vehicle Size Pricing
              </h2>
              <ul className="space-y-1 text-sm">
                {service.sizeModifiers
                  .sort((a, b) => a.deltaCents - b.deltaCents)
                  .map((mod) => (
                    <li key={mod.id} className="flex justify-between border-b py-1">
                      <span>{SIZE_LABELS[mod.size] ?? mod.size}</span>
                      <span className="font-medium">
                        {formatCentsToCAD(displayPrice + mod.deltaCents)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <Button size="lg" nativeButton={false} render={<Link href={`/book?service=${service.slug}`} />}>
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
