import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/service-card";
import { ProductCard } from "@/components/product-card";

export const metadata = {
  title: "Services & Products",
  description:
    "Browse exterior washes, interior detailing, ceramic coating, and retail products at Summit Shine.",
};

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-semibold text-primary">
          Services &amp; Products
        </h1>
        <p className="mt-2 text-muted-foreground">
          From a quick express wash to full ceramic coating — priced in CAD, taxes shown at
          checkout.
        </p>
      </div>

      {categories.map((category) =>
        category.services.length > 0 ? (
          <section key={category.id} className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-semibold">{category.name}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  slug={service.slug}
                  name={service.name}
                  description={service.description}
                  image={service.images[0]}
                  durationMin={service.durationMin}
                  basePriceCents={service.basePriceCents}
                  salePriceCents={service.salePriceCents}
                  featured={service.featured}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {products.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">Shop Retail Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                image={product.images[0]}
                priceCents={product.priceCents}
                salePriceCents={product.salePriceCents}
                stockQty={product.stockQty}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
