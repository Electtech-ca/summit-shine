import { prisma } from "@/lib/prisma";

export interface BookingSettings {
  gstPct: number;
  pstPct: number;
  bookingLeadTimeMin: number;
  maxAdvanceBookingDays: number;
  slotCapacity: number;
  bufferMinutes: number;
  depositPct: number;
  cancellationWindowHours: number;
  payAtLocationEnabled: boolean;
}

const DEFAULTS: BookingSettings = {
  gstPct: 5,
  pstPct: 7,
  bookingLeadTimeMin: 60,
  maxAdvanceBookingDays: 60,
  slotCapacity: 2,
  bufferMinutes: 10,
  depositPct: 20,
  cancellationWindowHours: 24,
  payAtLocationEnabled: true,
};

export async function getBookingSettings(): Promise<BookingSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    gstPct: Number(map.gstPct ?? DEFAULTS.gstPct),
    pstPct: Number(map.pstPct ?? DEFAULTS.pstPct),
    bookingLeadTimeMin: Number(map.bookingLeadTimeMin ?? DEFAULTS.bookingLeadTimeMin),
    maxAdvanceBookingDays: Number(map.maxAdvanceBookingDays ?? DEFAULTS.maxAdvanceBookingDays),
    slotCapacity: Number(map.slotCapacity ?? DEFAULTS.slotCapacity),
    bufferMinutes: Number(map.bufferMinutes ?? DEFAULTS.bufferMinutes),
    depositPct: Number(map.depositPct ?? DEFAULTS.depositPct),
    cancellationWindowHours: Number(map.cancellationWindowHours ?? DEFAULTS.cancellationWindowHours),
    payAtLocationEnabled: Boolean(map.payAtLocationEnabled ?? DEFAULTS.payAtLocationEnabled),
  };
}
