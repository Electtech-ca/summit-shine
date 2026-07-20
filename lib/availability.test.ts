import { describe, expect, it } from "vitest";
import {
  getAvailableSlots,
  getNextAvailableSlot,
  isSlotAvailable,
  type AvailabilityConfig,
  type BusinessHoursInput,
} from "./availability";

// A fixed reference "now": all days in these tests are built relative to it,
// and business hours are built from its own getDay() so the fixtures never
// depend on which real-world weekday July 22, 2026 lands on.
const NOW = new Date(2026, 6, 22, 10, 0, 0); // 10:00am on the reference day

function dayAt(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function allOpenHours(overrides: Partial<BusinessHoursInput> & { dayOfWeek: number }): BusinessHoursInput[] {
  const base: BusinessHoursInput[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "08:00",
    closeTime: "19:00",
    closed: false,
  }));
  return base.map((h) => (h.dayOfWeek === overrides.dayOfWeek ? { ...h, ...overrides } : h));
}

const STANDARD_HOURS: BusinessHoursInput[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  openTime: "08:00",
  closeTime: "19:00",
  closed: false,
}));

const CONFIG: AvailabilityConfig = {
  slotCapacity: 2,
  bufferMinutes: 10,
  slotIntervalMinutes: 30,
  leadTimeMinutes: 60,
  maxAdvanceDays: 60,
};

describe("isSlotAvailable", () => {
  it("is available within hours with no conflicting bookings", () => {
    const start = dayAt(1, 12, 0); // tomorrow at noon, well past lead time
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(true);
  });

  it("is unavailable before opening time", () => {
    const start = dayAt(1, 7, 0);
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(false);
  });

  it("is unavailable when the service would run past closing time", () => {
    const start = dayAt(1, 18, 45); // 30 min service ends 19:15, past 19:00 close
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(false);
  });

  it("is unavailable on a blackout date", () => {
    const start = dayAt(1, 12, 0);
    const blackout = [{ date: dayAt(1, 0, 0) }];
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, blackout, [], CONFIG, NOW)).toBe(false);
  });

  it("is unavailable on a day marked closed", () => {
    const start = dayAt(1, 12, 0);
    const hours = allOpenHours({ dayOfWeek: start.getDay(), closed: true, openTime: null, closeTime: null });
    expect(isSlotAvailable(start, 30, hours, [], [], CONFIG, NOW)).toBe(false);
  });

  it("is unavailable when it falls inside the lead-time window from now", () => {
    // NOW is 10:00; lead time is 60 min, so 10:30 same day is too soon.
    const start = dayAt(0, 10, 30);
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(false);
  });

  it("is available once it clears the lead-time window", () => {
    const start = dayAt(0, 11, 30); // 90 min after NOW, clears the 60 min lead time
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(true);
  });

  it("is unavailable beyond maxAdvanceDays", () => {
    const start = dayAt(CONFIG.maxAdvanceDays + 1, 12, 0);
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(false);
  });

  it("is available exactly at maxAdvanceDays", () => {
    const start = dayAt(CONFIG.maxAdvanceDays, 12, 0);
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(true);
  });

  it("is unavailable for a date in the past", () => {
    const start = dayAt(-1, 12, 0);
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toBe(false);
  });

  it("respects slot capacity — unavailable once fully booked", () => {
    const start = dayAt(1, 12, 0);
    const existing = [
      { startsAt: dayAt(1, 12, 0), endsAt: dayAt(1, 12, 30) },
      { startsAt: dayAt(1, 12, 0), endsAt: dayAt(1, 12, 30) },
    ];
    // capacity is 2, and both slots are already taken by overlapping bookings
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], existing, CONFIG, NOW)).toBe(false);
  });

  it("remains available under capacity", () => {
    const start = dayAt(1, 12, 0);
    const existing = [{ startsAt: dayAt(1, 12, 0), endsAt: dayAt(1, 12, 30) }];
    expect(isSlotAvailable(start, 30, STANDARD_HOURS, [], existing, CONFIG, NOW)).toBe(true);
  });

  it("treats the buffer minutes after a booking as occupied", () => {
    // existing booking ends 12:30, buffer is 10 min -> occupied until 12:40
    const existing = [{ startsAt: dayAt(1, 12, 0), endsAt: dayAt(1, 12, 30) }];
    const oneOffCapacityConfig: AvailabilityConfig = { ...CONFIG, slotCapacity: 1 };

    const duringBuffer = dayAt(1, 12, 35);
    expect(isSlotAvailable(duringBuffer, 30, STANDARD_HOURS, [], existing, oneOffCapacityConfig, NOW)).toBe(
      false,
    );

    const afterBuffer = dayAt(1, 12, 40);
    expect(isSlotAvailable(afterBuffer, 30, STANDARD_HOURS, [], existing, oneOffCapacityConfig, NOW)).toBe(
      true,
    );
  });
});

describe("getAvailableSlots", () => {
  it("returns evenly stepped slots across the full open window with no bookings", () => {
    const date = dayAt(1, 0, 0);
    const slots = getAvailableSlots(date, 30, STANDARD_HOURS, [], [], CONFIG, NOW);

    // 08:00 to 19:00 stepped by 30 min, last slot start must leave room for a 30-min service
    expect(slots.length).toBe(22); // (19:00 - 08:00) / 30min = 22 slots, each fits exactly
    expect(slots[0].getHours()).toBe(8);
    expect(slots[0].getMinutes()).toBe(0);
    const last = slots[slots.length - 1];
    expect(last.getHours()).toBe(18);
    expect(last.getMinutes()).toBe(30);
  });

  it("excludes slots once capacity is exhausted by existing bookings", () => {
    const date = dayAt(1, 0, 0);
    const fullCapacityConfig: AvailabilityConfig = { ...CONFIG, slotCapacity: 1 };
    const existing = [{ startsAt: dayAt(1, 12, 0), endsAt: dayAt(1, 12, 30) }];

    const slots = getAvailableSlots(date, 30, STANDARD_HOURS, [], existing, fullCapacityConfig, NOW);
    const noon = slots.find((s) => s.getHours() === 12 && s.getMinutes() === 0);
    expect(noon).toBeUndefined();
  });

  it("returns an empty list for a blackout date", () => {
    const date = dayAt(1, 0, 0);
    const blackout = [{ date: dayAt(1, 0, 0) }];
    expect(getAvailableSlots(date, 30, STANDARD_HOURS, blackout, [], CONFIG, NOW)).toEqual([]);
  });

  it("returns an empty list for a day marked closed", () => {
    const date = dayAt(1, 0, 0);
    const hours = allOpenHours({ dayOfWeek: date.getDay(), closed: true, openTime: null, closeTime: null });
    expect(getAvailableSlots(date, 30, hours, [], [], CONFIG, NOW)).toEqual([]);
  });

  it("returns an empty list when the service duration exceeds the open window", () => {
    const date = dayAt(1, 0, 0);
    expect(getAvailableSlots(date, 12 * 60, STANDARD_HOURS, [], [], CONFIG, NOW)).toEqual([]);
  });

  it("returns an empty list beyond maxAdvanceDays", () => {
    const date = dayAt(CONFIG.maxAdvanceDays + 5, 0, 0);
    expect(getAvailableSlots(date, 30, STANDARD_HOURS, [], [], CONFIG, NOW)).toEqual([]);
  });
});

describe("getNextAvailableSlot", () => {
  it("finds the first slot on the starting day when available", () => {
    const next = getNextAvailableSlot(dayAt(1, 0, 0), 30, STANDARD_HOURS, [], [], CONFIG, NOW);
    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(8);
  });

  it("skips forward past a blacked-out day to the next open one", () => {
    const blackout = [{ date: dayAt(1, 0, 0) }];
    const next = getNextAvailableSlot(dayAt(1, 0, 0), 30, STANDARD_HOURS, blackout, [], CONFIG, NOW);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(dayAt(2, 0, 0).getDate());
  });

  it("returns null when nothing is available within the search window", () => {
    const alwaysClosed: BusinessHoursInput[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      openTime: null,
      closeTime: null,
      closed: true,
    }));
    const next = getNextAvailableSlot(dayAt(1, 0, 0), 30, alwaysClosed, [], [], CONFIG, NOW, 5);
    expect(next).toBeNull();
  });
});
