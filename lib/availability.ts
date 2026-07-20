// Pure slot-availability calculator: business hours + blackout dates +
// existing bookings + capacity/buffer rules -> available start times for a
// given day, or a yes/no check for one specific start time. No I/O, no DB
// access — callers resolve BusinessHours/BlackoutDate/Booking rows and pass
// them in here.

export interface BusinessHoursInput {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  openTime: string | null; // "HH:mm"
  closeTime: string | null; // "HH:mm"
  closed: boolean;
}

export interface BlackoutDateInput {
  date: Date;
}

export interface ExistingBookingInput {
  startsAt: Date;
  endsAt: Date;
}

export interface AvailabilityConfig {
  /** Number of concurrent bookings allowed in an overlapping window (bays/staff). */
  slotCapacity: number;
  /** Minutes to hold after a booking's end before the bay is free again. */
  bufferMinutes: number;
  /** Granularity of slot start times, in minutes (e.g. 15, 30). */
  slotIntervalMinutes: number;
  /** Minimum minutes from "now" before a same-day slot can be booked. */
  leadTimeMinutes: number;
  /** How many days ahead bookings may be made. */
  maxAdvanceDays: number;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseTimeOnDate(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDateBlackedOut(date: Date, blackoutDates: BlackoutDateInput[]): boolean {
  return blackoutDates.some((b) => isSameCalendarDay(b.date, date));
}

function isWithinBookingWindow(date: Date, config: AvailabilityConfig, now: Date): boolean {
  const today = startOfDay(now);
  const target = startOfDay(date);
  if (target < today) return false;

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.maxAdvanceDays);
  if (target > maxDate) return false;

  return true;
}

function countOverlapping(
  candidateStart: Date,
  candidateEnd: Date,
  existingBookings: ExistingBookingInput[],
  bufferMinutes: number,
): number {
  return existingBookings.filter((booking) => {
    const occupiedEnd = new Date(booking.endsAt.getTime() + bufferMinutes * 60_000);
    return candidateStart < occupiedEnd && booking.startsAt < candidateEnd;
  }).length;
}

/**
 * Whether a specific start time is bookable for a service of the given
 * duration, given business hours, blackout dates, existing bookings, and
 * capacity/buffer/lead-time/advance-window rules.
 */
export function isSlotAvailable(
  startsAt: Date,
  durationMinutes: number,
  hours: BusinessHoursInput[],
  blackoutDates: BlackoutDateInput[],
  existingBookings: ExistingBookingInput[],
  config: AvailabilityConfig,
  now: Date = new Date(),
): boolean {
  if (!isWithinBookingWindow(startsAt, config, now)) return false;
  if (isDateBlackedOut(startsAt, blackoutDates)) return false;

  const todayHours = hours.find((h) => h.dayOfWeek === startsAt.getDay());
  if (!todayHours || todayHours.closed || !todayHours.openTime || !todayHours.closeTime) {
    return false;
  }

  const open = parseTimeOnDate(startsAt, todayHours.openTime);
  const close = parseTimeOnDate(startsAt, todayHours.closeTime);
  const candidateEnd = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (startsAt < open || candidateEnd > close) return false;

  const leadCutoff = new Date(now.getTime() + config.leadTimeMinutes * 60_000);
  if (startsAt < leadCutoff) return false;

  const overlapping = countOverlapping(startsAt, candidateEnd, existingBookings, config.bufferMinutes);
  return overlapping < config.slotCapacity;
}

/**
 * All bookable start times on a given calendar date for a service of the
 * given duration, stepped by config.slotIntervalMinutes.
 */
export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  hours: BusinessHoursInput[],
  blackoutDates: BlackoutDateInput[],
  existingBookings: ExistingBookingInput[],
  config: AvailabilityConfig,
  now: Date = new Date(),
): Date[] {
  if (!isWithinBookingWindow(date, config, now)) return [];
  if (isDateBlackedOut(date, blackoutDates)) return [];

  const todayHours = hours.find((h) => h.dayOfWeek === date.getDay());
  if (!todayHours || todayHours.closed || !todayHours.openTime || !todayHours.closeTime) {
    return [];
  }

  const open = parseTimeOnDate(date, todayHours.openTime);
  const close = parseTimeOnDate(date, todayHours.closeTime);

  const slots: Date[] = [];
  for (
    let candidate = new Date(open);
    candidate.getTime() + durationMinutes * 60_000 <= close.getTime();
    candidate = new Date(candidate.getTime() + config.slotIntervalMinutes * 60_000)
  ) {
    if (isSlotAvailable(candidate, durationMinutes, hours, blackoutDates, existingBookings, config, now)) {
      slots.push(new Date(candidate));
    }
  }

  return slots;
}

/** The next available slot at or after `from`, searching up to `maxDaysToSearch` days ahead. */
export function getNextAvailableSlot(
  from: Date,
  durationMinutes: number,
  hours: BusinessHoursInput[],
  blackoutDates: BlackoutDateInput[],
  existingBookings: ExistingBookingInput[],
  config: AvailabilityConfig,
  now: Date = new Date(),
  maxDaysToSearch = 14,
): Date | null {
  for (let i = 0; i <= maxDaysToSearch; i++) {
    const day = new Date(from);
    day.setDate(day.getDate() + i);
    const slots = getAvailableSlots(day, durationMinutes, hours, blackoutDates, existingBookings, config, now);
    if (slots.length > 0) return slots[0];
  }
  return null;
}
