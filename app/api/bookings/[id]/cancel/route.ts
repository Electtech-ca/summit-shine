import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookingSettings } from "@/lib/booking-settings";
import { sendBookingCancellationEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return NextResponse.json({ error: "This booking can't be cancelled" }, { status: 400 });
  }

  const settings = await getBookingSettings();
  const hoursUntilStart = (booking.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const isLate = hoursUntilStart < settings.cancellationWindowHours;

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  await sendBookingCancellationEmail({
    to: session.user.email!,
    reference: updated.reference,
    startsAt: updated.startsAt,
  });

  return NextResponse.json({
    ok: true,
    lateCancellation: isLate,
    message: isLate
      ? `This was within the ${settings.cancellationWindowHours}-hour cancellation window — any deposit paid may be forfeited.`
      : "Cancelled — no fees apply.",
  });
}
