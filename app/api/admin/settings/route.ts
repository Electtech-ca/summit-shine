import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit-log";

const schema = z.object({
  businessName: z.string().min(1),
  gstPct: z.number().min(0).max(100),
  pstPct: z.number().min(0).max(100),
  bookingLeadTimeMin: z.number().int().min(0),
  maxAdvanceBookingDays: z.number().int().min(1),
  slotCapacity: z.number().int().min(1),
  bufferMinutes: z.number().int().min(0),
  depositPct: z.number().int().min(0).max(100),
  cancellationWindowHours: z.number().int().min(0),
  payAtLocationEnabled: z.boolean(),
  smsRemindersEnabled: z.boolean(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const rows = await prisma.siteSetting.findMany();
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    ),
  );

  await writeAuditLog({ userId: session.userId, action: "UPDATE", entity: "SiteSetting", after: parsed.data });

  return NextResponse.json({ ok: true });
}
