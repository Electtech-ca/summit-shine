import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [services, products] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.product.findMany({ where: { active: true }, select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/memberships`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/book`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/gift-cards`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/shop/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...serviceRoutes, ...productRoutes];
}
