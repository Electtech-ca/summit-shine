import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/email";

// Reads "now" and live DB state on every invocation — must never be
// statically optimized/cached, or a scheduler would keep re-running one
// frozen build-time response instead of checking real upcoming bookings.
export const dynamic = "force-dynamic";

// Intended to be hit hourly by a scheduler (Vercel Cron, etc.) — sends a
// reminder to bookings starting 23-25h from now. There's no
// reminderSentAt field on Booking to dedupe against re-triggers, so the
// narrow window is the dedupe mechanism: as long as this runs roughly
// hourly, each booking falls in the window exactly once.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      startsAt: { gte: windowStart, lt: windowEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: { items: { include: { service: true } }, user: true },
  });

  let sent = 0;
  for (const booking of bookings) {
    const to = booking.user?.email ?? booking.guestEmail;
    if (!to) continue;
    await sendBookingReminderEmail({
      to,
      reference: booking.reference,
      serviceNames: booking.items.map((i) => i.service.name),
      startsAt: booking.startsAt,
    });
    sent++;
  }

  return NextResponse.json({ checked: bookings.length, sent });
}
