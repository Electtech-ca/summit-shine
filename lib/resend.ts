import { Resend } from "resend";

const globalForResend = globalThis as unknown as { resend: Resend | undefined };

function createResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Defer the failure until something actually calls a Resend method, so
    // merely importing this module doesn't crash when email isn't
    // configured yet (mirrors lib/stripe.ts's lazy pattern).
    return new Proxy({} as Resend, {
      get() {
        throw new Error(
          "RESEND_API_KEY is not set. Add your Resend API key to .env to enable emails.",
        );
      },
    });
  }
  return new Resend(apiKey);
}

export const resend = globalForResend.resend ?? createResendClient();

if (process.env.NODE_ENV !== "production") globalForResend.resend = resend;

export const EMAIL_FROM = "Summit Shine <bookings@summitshine.ca>";
