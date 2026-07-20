import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PaymentMethodsManager } from "@/components/stripe/payment-methods-manager";

export default async function PaymentMethodsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <PaymentMethodsManager publishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""} />
  );
}
