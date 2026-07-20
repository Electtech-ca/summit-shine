import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const [service, categories] = await Promise.all([
    prisma.service.findUnique({ where: { id: params.id }, include: { sizeModifiers: true } }),
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Edit Service</h1>
      <ServiceForm service={service} categories={categories} />
    </div>
  );
}
