import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
