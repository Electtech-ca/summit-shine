import { DiscountForm } from "@/components/admin/discount-form";

export default function NewDiscountPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">New Discount</h1>
      <DiscountForm />
    </div>
  );
}
