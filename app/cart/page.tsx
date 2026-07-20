import { auth } from "@/auth";
import { getBookingSettings } from "@/lib/booking-settings";
import { CartPageClient } from "@/components/cart/cart-page-client";

export default async function CartPage() {
  const session = await auth();
  const settings = await getBookingSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 font-display text-4xl font-semibold text-primary">Your Cart</h1>
      <CartPageClient
        isSignedIn={!!session?.user}
        defaultEmail={session?.user?.email ?? ""}
        gstPct={settings.gstPct}
        pstPct={settings.pstPct}
        publishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
      />
    </div>
  );
}
