import type { BlackoutDate, BusinessHours } from "@prisma/client";

export function getTodayStatus(
  hours: BusinessHours[],
  blackoutDates: BlackoutDate[],
  now: Date = new Date(),
) {
  const todayHours = hours.find((h) => h.dayOfWeek === now.getDay());
  const isBlackout = blackoutDates.some(
    (b) =>
      b.date.getFullYear() === now.getFullYear() &&
      b.date.getMonth() === now.getMonth() &&
      b.date.getDate() === now.getDate(),
  );

  if (!todayHours || todayHours.closed || isBlackout || !todayHours.openTime || !todayHours.closeTime) {
    return { isOpen: false, openTime: null, closeTime: null };
  }

  const [openH, openM] = todayHours.openTime.split(":").map(Number);
  const [closeH, closeM] = todayHours.closeTime.split(":").map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return {
    isOpen: minutesNow >= openMinutes && minutesNow < closeMinutes,
    openTime: todayHours.openTime,
    closeTime: todayHours.closeTime,
  };
}
