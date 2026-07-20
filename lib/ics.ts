function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICSText(text: string): string {
  return text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function generateBookingICS(params: {
  reference: string;
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
}): string {
  const now = toICSDate(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Summit Shine Car Wash & Detail Co.//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.reference}@summitshine.ca`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(params.startsAt)}`,
    `DTEND:${toICSDate(params.endsAt)}`,
    `SUMMARY:${escapeICSText(params.summary)}`,
    `DESCRIPTION:${escapeICSText(params.description)}`,
    params.location ? `LOCATION:${escapeICSText(params.location)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
