import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DiscountForm } from "@/components/admin/discount-form";

export default async function EditDiscountPage({ params }: { params: { id: string } }) {
  const discount = await prisma.discount.findUnique({ where: { id: params.id } });
  if (!discount) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Edit Discount</h1>
      <DiscountForm discount={discount} />
    </div>
  );
}
