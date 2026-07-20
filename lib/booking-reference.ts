export function generateBookingReference(date: Date = new Date()): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `SS-${year}-${random}`;
}
