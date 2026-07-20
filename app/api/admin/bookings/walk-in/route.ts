import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { calculatePricing, type PricingLineItem } from "@/lib/pricing";
import { getBookingSettings } from "@/lib/booking-settings";
import { generateBookingReference } from "@/lib/booking-reference";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  serviceIds: z.array(z.string()).min(1),
  vehicleSize: z.enum(["SEDAN", "SUV", "TRUCK", "OVERSIZED"]).default("SEDAN"),
  guestName: z.string().min(1).max(120),
  markPaid: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const services = await prisma.service.findMany({
    where: { id: { in: parsed.data.serviceIds }, active: true },
    include: { sizeModifiers: true },
  });
  if (services.length !== new Set(parsed.data.serviceIds).size) {
    return NextResponse.json({ error: "One or more services are unavailable" }, { status: 400 });
  }

  const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMin, 0);
  const pricingItems: PricingLineItem[] = services.map((s) => {
    const modifier = s.sizeModifiers.find((m) => m.size === parsed.data.vehicleSize);
    return {
      id: s.id,
      name: s.name,
      unitPriceCents: s.salePriceCents ?? s.basePriceCents,
      quantity: 1,
      sizeDeltaCents: modifier?.deltaCents ?? 0,
    };
  });

  const settings = await getBookingSettings();
  const pricing = calculatePricing(pricingItems, null, { gstPct: settings.gstPct, pstPct: settings.pstPct });

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + totalDurationMinutes * 60_000);

  const booking = await prisma.booking.create({
    data: {
      reference: generateBookingReference(startsAt),
      guestName: parsed.data.guestName,
      startsAt,
      endsAt,
      status: "CONFIRMED",
      paymentStatus: parsed.data.markPaid ? "PAID" : "UNPAID",
      subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents,
      taxCents: pricing.taxCents,
      totalCents: pricing.totalCents,
      items: {
        create: services.map((s) => {
          const modifier = s.sizeModifiers.find((m) => m.size === parsed.data.vehicleSize);
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

  await writeAuditLog({
    userId: session.userId,
    action: "CREATE",
    entity: "Booking",
    entityId: booking.id,
    after: { reference: booking.reference, guestName: booking.guestName, totalCents: booking.totalCents },
  });

  return NextResponse.json(booking, { status: 201 });
}
