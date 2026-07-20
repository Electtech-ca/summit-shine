import { auth } from "@/auth";
import { GiftCardPurchase } from "@/components/stripe/gift-card-purchase";

export const metadata = {
  title: "Gift Cards | Summit Shine Car Wash & Detail Co.",
  description: "Buy a Summit Shine gift card for any BC driver on your list.",
};

export default async function GiftCardsPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 font-display text-4xl font-semibold text-primary">Gift Cards</h1>
      <p className="mb-8 text-muted-foreground">
        Give the gift of shine — redeemable on any wash, detail, or membership.
      </p>
      <GiftCardPurchase
        publishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
        defaultEmail={session?.user?.email ?? ""}
      />
    </div>
  );
}
