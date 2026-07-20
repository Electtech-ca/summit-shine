import { resend, EMAIL_FROM } from "@/lib/resend";
import { generateBookingICS } from "@/lib/ics";
import { formatCentsToCAD } from "@/lib/format";

// Every function here is fire-and-forget from the caller's perspective: a
// failed email (unconfigured API key, unverified domain, network error)
// logs and returns rather than throwing, since email delivery should never
// block or fail a booking/payment/membership action.
async function safeSend(payload: Parameters<typeof resend.emails.send>[0]) {
  try {
    const { error } = await resend.emails.send(payload);
    if (error) console.error("Email send failed:", error);
  } catch (err) {
    console.error("Email send threw:", err);
  }
}

function layout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 560px; margin: 0 auto; color: #1F2937;">
      <h1 style="color: #0B3C5D; font-size: 22px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">
        Summit Shine Car Wash & Detail Co. — British Columbia, Canada
      </p>
    </div>
  `;
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  reference: string;
  serviceNames: string[];
  startsAt: Date;
  endsAt: Date;
  totalCents: number;
}) {
  const when = params.startsAt.toLocaleString("en-CA", { dateStyle: "full", timeStyle: "short" });
  const ics = generateBookingICS({
    reference: params.reference,
    summary: `Summit Shine: ${params.serviceNames.join(", ")}`,
    description: `Booking reference ${params.reference}`,
    startsAt: params.startsAt,
    endsAt: params.endsAt,
  });

  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Booking Confirmed — ${params.reference}`,
    html: layout(
      "Your booking is confirmed",
      `
        <p>Reference: <strong>${params.reference}</strong></p>
        <p>When: ${when}</p>
        <p>Services: ${params.serviceNames.join(", ")}</p>
        <p>Total: ${formatCentsToCAD(params.totalCents)}</p>
      `,
    ),
    attachments: [
      { filename: "booking.ics", content: Buffer.from(ics).toString("base64") },
    ],
  });
}

export async function sendBookingCancellationEmail(params: {
  to: string;
  reference: string;
  startsAt: Date;
}) {
  const when = params.startsAt.toLocaleString("en-CA", { dateStyle: "full", timeStyle: "short" });
  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Booking Cancelled — ${params.reference}`,
    html: layout(
      "Your booking has been cancelled",
      `<p>Reference: <strong>${params.reference}</strong></p><p>Originally scheduled: ${when}</p>`,
    ),
  });
}

export async function sendBookingReminderEmail(params: {
  to: string;
  reference: string;
  serviceNames: string[];
  startsAt: Date;
}) {
  const when = params.startsAt.toLocaleString("en-CA", { dateStyle: "full", timeStyle: "short" });
  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Reminder: Your wash is tomorrow — ${params.reference}`,
    html: layout(
      "See you tomorrow!",
      `
        <p>Reference: <strong>${params.reference}</strong></p>
        <p>When: ${when}</p>
        <p>Services: ${params.serviceNames.join(", ")}</p>
      `,
    ),
  });
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  reference: string;
  description: string;
  amountCents: number;
}) {
  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Receipt — ${params.reference}`,
    html: layout(
      "Payment received",
      `
        <p>Reference: <strong>${params.reference}</strong></p>
        <p>${params.description}</p>
        <p>Amount: ${formatCentsToCAD(params.amountCents)}</p>
      `,
    ),
  });
}

export async function sendMembershipWelcomeEmail(params: {
  to: string;
  planName: string;
  priceCents: number;
}) {
  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Welcome to ${params.planName}!`,
    html: layout(
      `Welcome to ${params.planName}`,
      `<p>Your membership is active at ${formatCentsToCAD(params.priceCents)}/month. Manage it anytime from your account.</p>`,
    ),
  });
}

export async function sendGiftCardEmail(params: {
  to: string;
  code: string;
  amountCents: number;
}) {
  await safeSend({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Your Summit Shine Gift Card",
    html: layout(
      "Give the gift of shine",
      `
        <p>Your gift card code:</p>
        <p style="font-size: 24px; font-weight: 600; letter-spacing: 2px;">${params.code}</p>
        <p>Balance: ${formatCentsToCAD(params.amountCents)}</p>
        <p>Redeemable at checkout or booking.</p>
      `,
    ),
  });
}
