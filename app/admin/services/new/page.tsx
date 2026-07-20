import { prisma } from "@/lib/prisma";
import { ServiceForm } from "@/components/admin/service-form";

export default async function NewServicePage() {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">New Service</h1>
      <ServiceForm categories={categories} />
    </div>
  );
}
