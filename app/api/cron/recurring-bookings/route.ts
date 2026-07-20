import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePricing, type PricingLineItem } from "@/lib/pricing";
import { isSlotAvailable } from "@/lib/availability";
import { getBookingSettings } from "@/lib/booking-settings";
import { resolveBestAutomaticDiscount } from "@/lib/discount-resolution";
import { getMemberDetailDiscountPct } from "@/lib/member-discount";
import { generateBookingReference } from "@/lib/booking-reference";
import { sendBookingConfirmationEmail } from "@/lib/email";

// Reads "now" and live DB state on every invocation — must never be
// statically optimized/cached (see the identical note in the reminders
// cron route).
export const dynamic = "force-dynamic";

function addByFrequency(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (frequency === "BIWEEKLY") next.setDate(next.getDate() + 14);
  else next.setMonth(next.getMonth() + 1); // MONTHLY
  return next;
}

// Intended to run daily. Keeps each active recurring series one occurrence
// ahead: once the latest generated booking in a series has started (or is
// due within 24h), generates the next one by copying the previous
// booking's services/vehicle and re-pricing at current rates.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await getBookingSettings();
  const [hours, blackoutDates, series] = await Promise.all([
    prisma.businessHours.findMany(),
    prisma.blackoutDate.findMany(),
    prisma.recurringBooking.findMany({
      where: { active: true },
      include: {
        bookings: {
          orderBy: { startsAt: "desc" },
          take: 1,
          include: { items: { include: { service: true } }, vehicle: true, user: true },
        },
      },
    }),
  ]);

  let generated = 0;
  const skipped: string[] = [];

  for (const recurring of series) {
    const latest = recurring.bookings[0];
    if (!latest) continue;

    const dueThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (latest.startsAt > dueThreshold) continue; // not due yet

    const nextStartsAt = addByFrequency(latest.startsAt, recurring.frequency);
    const alreadyExists = await prisma.booking.findFirst({
      where: { recurrenceId: recurring.id, startsAt: nextStartsAt },
    });
    if (alreadyExists) continue;

    const vehicleSize = latest.vehicle?.size ?? "SEDAN";
    const serviceIds = latest.items.map((i) => i.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
      include: { sizeModifiers: true, category: true },
    });
    if (services.length !== serviceIds.length) {
      skipped.push(`${recurring.id}: a service in this series is no longer available`);
      continue;
    }

    const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMin, 0);
    const nextEndsAt = new Date(nextStartsAt.getTime() + totalDurationMinutes * 60_000);

    const dayStart = new Date(nextStartsAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingBookings = await prisma.booking.findMany({
      where: { startsAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { startsAt: true, endsAt: true },
    });

    const available = isSlotAvailable(
      nextStartsAt,
      totalDurationMinutes,
      hours,
      blackoutDates,
      existingBookings,
      {
        slotCapacity: settings.slotCapacity,
        bufferMinutes: settings.bufferMinutes,
        slotIntervalMinutes: 30,
        leadTimeMinutes: 0,
        maxAdvanceDays: settings.maxAdvanceBookingDays,
      },
    );
    if (!available) {
      skipped.push(`${recurring.id}: ${nextStartsAt.toISOString()} is unavailable`);
      continue;
    }

    const memberDetailDiscountPct = await getMemberDetailDiscountPct(recurring.userId);
    const pricingItems: PricingLineItem[] = services.map((s) => {
      const modifier = s.sizeModifiers.find((m) => m.size === vehicleSize);
      const base = s.salePriceCents ?? s.basePriceCents;
      const unitPriceCents =
        memberDetailDiscountPct > 0 && s.category.slug === "detailing"
          ? Math.round((base * (100 - memberDetailDiscountPct)) / 100)
          : base;
      return {
        id: s.id,
        name: s.name,
        unitPriceCents,
        quantity: 1,
        sizeDeltaCents: modifier?.deltaCents ?? 0,
      };
    });

    const auto = await resolveBestAutomaticDiscount(pricingItems, recurring.userId);
    const pricing = calculatePricing(pricingItems, auto?.pricingDiscount ?? null, {
      gstPct: settings.gstPct,
      pstPct: settings.pstPct,
    });
    const depositCents = settings.payAtLocationEnabled
      ? Math.round((pricing.totalCents * settings.depositPct) / 100)
      : pricing.totalCents;

    const booking = await prisma.booking.create({
      data: {
        reference: generateBookingReference(nextStartsAt),
        userId: recurring.userId,
        vehicleId: latest.vehicleId,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        subtotalCents: pricing.subtotalCents,
        discountCents: pricing.discountCents,
        taxCents: pricing.taxCents,
        totalCents: pricing.totalCents,
        depositCents,
        discountId: auto?.discountId,
        recurrenceId: recurring.id,
        items: {
          create: services.map((s) => {
            const modifier = s.sizeModifiers.find((m) => m.size === vehicleSize);
            return {
              serviceId: s.id,
              priceCents: s.salePriceCents ?? s.basePriceCents,
              sizeDeltaCents: modifier?.deltaCents ?? 0,
            };
          }),
        },
      },
      include: { items: { include: { service: true } } },
    });

    if (latest.user?.email) {
      await sendBookingConfirmationEmail({
        to: latest.user.email,
        reference: booking.reference,
        serviceNames: booking.items.map((i) => i.service.name),
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        totalCents: booking.totalCents,
      });
    }

    generated++;
  }

  return NextResponse.json({ checked: series.length, generated, skipped });
}
