import { NextResponse } from "next/server";
import { Prisma, VehicleSize } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validations/booking";
import { calculatePricing, type PricingLineItem } from "@/lib/pricing";
import { isSlotAvailable } from "@/lib/availability";
import { getBookingSettings } from "@/lib/booking-settings";
import { resolveDiscountByCode } from "@/lib/discount-resolution";
import { generateBookingReference } from "@/lib/booking-reference";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { service: true } }, vehicle: true },
    orderBy: { startsAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (!session?.user && !(data.guestName && data.guestEmail)) {
    return NextResponse.json(
      { error: "Sign in or provide your name and email to book as a guest." },
      { status: 400 },
    );
  }

  // Resolve the vehicle size: either from a saved vehicle (must belong to
  // the caller) or the guest-supplied size.
  let vehicleSize: VehicleSize;
  let vehicleId: string | null = null;
  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle || vehicle.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    vehicleSize = vehicle.size;
    vehicleId = vehicle.id;
  } else {
    vehicleSize = data.vehicleSize!;
  }

  const serviceIds = data.items.map((i) => i.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, active: true },
    include: { sizeModifiers: true },
  });
  if (services.length !== new Set(serviceIds).size) {
    return NextResponse.json({ error: "One or more services are unavailable" }, { status: 400 });
  }

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const totalDurationMinutes = data.items.reduce((sum, item) => {
    const service = serviceById.get(item.serviceId)!;
    return sum + service.durationMin * item.quantity;
  }, 0);

  const pricingItems: PricingLineItem[] = data.items.map((item) => {
    const service = serviceById.get(item.serviceId)!;
    const sizeModifier = service.sizeModifiers.find((m) => m.size === vehicleSize);
    return {
      id: service.id,
      name: service.name,
      unitPriceCents: service.salePriceCents ?? service.basePriceCents,
      quantity: item.quantity,
      sizeDeltaCents: sizeModifier?.deltaCents ?? 0,
    };
  });

  const settings = await getBookingSettings();

  let discountId: string | null = null;
  let pricingDiscount = null;
  if (data.promoCode) {
    const result = await resolveDiscountByCode(
      data.promoCode.trim().toUpperCase(),
      serviceIds,
      session?.user?.id,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    discountId = result.discountId;
    pricingDiscount = result.pricingDiscount;
  }

  const pricing = calculatePricing(pricingItems, pricingDiscount, {
    gstPct: settings.gstPct,
    pstPct: settings.pstPct,
  });

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + totalDurationMinutes * 60_000);

  const dayStart = new Date(startsAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [hours, blackoutDates, existingBookings] = await Promise.all([
    prisma.businessHours.findMany(),
    prisma.blackoutDate.findMany(),
    prisma.booking.findMany({
      where: { startsAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const available = isSlotAvailable(
    startsAt,
    totalDurationMinutes,
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
  if (!available) {
    return NextResponse.json(
      { error: "That time is no longer available. Please choose another slot." },
      { status: 409 },
    );
  }

  const depositCents = settings.payAtLocationEnabled
    ? Math.round((pricing.totalCents * settings.depositPct) / 100)
    : pricing.totalCents;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const created = await tx.booking.create({
          data: {
            reference: generateBookingReference(startsAt),
            userId: session?.user?.id,
            guestName: session?.user ? undefined : data.guestName,
            guestEmail: session?.user ? undefined : data.guestEmail,
            guestPhone: session?.user ? undefined : data.guestPhone,
            vehicleId,
            startsAt,
            endsAt,
            subtotalCents: pricing.subtotalCents,
            discountCents: pricing.discountCents,
            taxCents: pricing.taxCents,
            totalCents: pricing.totalCents,
            depositCents,
            discountId,
            notes: data.notes,
            items: {
              create: data.items.map((item) => {
                const service = serviceById.get(item.serviceId)!;
                const sizeModifier = service.sizeModifiers.find((m) => m.size === vehicleSize);
                return {
                  serviceId: service.id,
                  priceCents: service.salePriceCents ?? service.basePriceCents,
                  sizeDeltaCents: sizeModifier?.deltaCents ?? 0,
                };
              }),
            },
          },
          include: { items: { include: { service: true } } },
        });

        if (discountId) {
          await tx.discount.update({
            where: { id: discountId },
            data: { usedCount: { increment: 1 } },
          });
        }

        return created;
      });

      return NextResponse.json(booking, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue; // reference collision, retry with a new one
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Failed to create booking, please try again." }, { status: 500 });
}
