import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { getTodayStatus } from "@/lib/hours";
import { getBusinessName } from "@/lib/business-name";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceCard } from "@/components/service-card";
import { HeroRotator } from "@/components/hero-rotator";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Droplets, Leaf, Sparkles, Snowflake } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Home() {
  const [featuredServices, plans, testimonials, hours, blackoutDates, businessName] = await Promise.all([
    prisma.service.findMany({
      where: { featured: true, active: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.membershipPlan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } }),
    prisma.testimonial.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.businessHours.findMany(),
    prisma.blackoutDate.findMany(),
    getBusinessName(),
  ]);

  const status = getTodayStatus(hours, blackoutDates);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: businessName,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Vancouver",
      addressRegion: "BC",
      addressCountry: "CA",
    },
    geo: { "@type": "GeoCoordinates", latitude: 49.2827, longitude: -123.1207 },
    telephone: "+1-604-555-0100",
    priceRange: "$$",
    openingHoursSpecification: hours
      .filter((h) => !h.closed && h.openTime && h.closeTime)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[h.dayOfWeek]}`,
        opens: h.openTime,
        closes: h.closeTime,
      })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <HeroRotator />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center text-white">
          <h1 className="font-display text-4xl font-semibold sm:text-6xl">
            Shine like a BC morning.
          </h1>
          <p className="mt-4 text-lg text-white/90 sm:text-xl">
            Premium car wash and detailing, done right — from the Coast Mountains to the Pacific
            shoreline.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" nativeButton={false} render={<Link href="/book" />}>
              Book a Wash
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              nativeButton={false}
              render={<Link href="/memberships" />}
            >
              View Memberships
            </Button>
          </div>
        </div>
      </section>

      {/* Hours & wash status bar */}
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${status.isOpen ? "bg-accent" : "bg-destructive"}`}
            />
            {status.isOpen ? "Open now" : "Closed now"}
            {status.openTime && status.closeTime && (
              <span className="text-muted-foreground">
                · Today {status.openTime}–{status.closeTime}
              </span>
            )}
          </span>
          <Link href="/faq" className="text-primary hover:underline">
            Hours &amp; holiday closures
          </Link>
        </div>
      </div>

      {/* Featured services */}
      {featuredServices.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold">Featured Services</h2>
            <Link href="/services" className="text-sm font-medium text-primary hover:underline">
              View all services →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
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
      )}

      {/* Membership teaser */}
      {plans.length > 0 && (
        <section className="bg-secondary/30 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-semibold">Unlimited Washes, Member Pricing</h2>
              <p className="mt-2 text-muted-foreground">
                Pick a tier and never pay per-wash again.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-2 font-display text-2xl font-semibold text-primary">
                      {formatCentsToCAD(plan.priceCents)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button nativeButton={false} render={<Link href="/memberships" />}>
                Compare Plans
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Why Summit Shine */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold">Why Summit Shine</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Droplets, title: "Water Reclamation", body: "Our bays recycle wash water to minimize environmental impact." },
            { icon: Sparkles, title: "Spot-Free Rinse", body: "Deionized final rinse for a streak-free, spot-free finish." },
            { icon: Leaf, title: "Eco-Friendly Soaps", body: "Biodegradable formulas that are gentle on BC's waterways." },
            { icon: Snowflake, title: "Built for BC Winters", body: "Salt and undercarriage packages to fight coastal-winter corrosion." },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <item.icon className="mx-auto mb-3 h-8 w-8 text-accent" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gift card promo */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-3xl font-semibold">Give the Gift of Shine</h2>
          <p className="mt-2 text-primary-foreground/80">
            Summit Shine gift cards — perfect for any BC driver on your list.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              nativeButton={false}
              render={<Link href="/services" />}
            >
              Shop Gift Cards
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 font-display text-3xl font-semibold">What Drivers Are Saying</h2>
          <TestimonialsCarousel testimonials={testimonials} />
        </section>
      )}

      {/* Map + Newsletter */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Find Us</h2>
          <div className="aspect-video overflow-hidden rounded-lg border border-border">
            <iframe
              title="Summit Shine location map"
              className="h-full w-full"
              loading="lazy"
              src="https://www.google.com/maps?q=Vancouver,BC,Canada&output=embed"
            />
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Stay in the Loop</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Seasonal specials, new services, and BC-winter reminders — no spam.
          </p>
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
