import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";
import { getBookingSettings } from "@/lib/booking-settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD
  const durationParam = searchParams.get("durationMinutes");

  if (!dateParam || !durationParam) {
    return NextResponse.json({ error: "date and durationMinutes are required" }, { status: 400 });
  }

  const [year, month, day] = dateParam.split("-").map(Number);
  if (!year || !month || !day) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const date = new Date(year, month - 1, day);
  const durationMinutes = Number(durationParam);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json({ error: "Invalid durationMinutes" }, { status: 400 });
  }

  const dayStart = new Date(year, month - 1, day, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0);

  const [hours, blackoutDates, existingBookings, settings] = await Promise.all([
    prisma.businessHours.findMany(),
    prisma.blackoutDate.findMany(),
    prisma.booking.findMany({
      where: {
        startsAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { startsAt: true, endsAt: true },
    }),
    getBookingSettings(),
  ]);

  const slots = getAvailableSlots(
    date,
    durationMinutes,
    hours,
    blackoutDates,
    existingBookings,
    {
      slotCapacity: settings.slotCapacity,
      bufferMinutes: settings.bufferMinutes,
      slotIntervalMinutes: 30,
      leadTimeMinutes: settings.bookingLeadTimeMin,
      maxAdvanceDays: settings.maxAdvanceBookingDays,
    },
  );

  return NextResponse.json({ slots: slots.map((s) => s.toISOString()) });
}
