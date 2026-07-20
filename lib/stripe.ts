import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

function createStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    // Defer the failure until something actually calls a Stripe method, so
    // merely importing this module (e.g. Next.js collecting route metadata
    // at build time) doesn't crash when Stripe isn't configured yet.
    return new Proxy({} as Stripe, {
      get() {
        throw new Error(
          "STRIPE_SECRET_KEY is not set. Add your Stripe test-mode secret key to .env to enable payments.",
        );
      },
    });
  }
  return new Stripe(apiKey, { apiVersion: "2026-06-24.dahlia", typescript: true });
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;
