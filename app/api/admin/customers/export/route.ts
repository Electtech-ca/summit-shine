import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { bookings: { select: { totalCents: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Name", "Email", "Phone", "Lifetime Spend (CAD)", "Joined"],
    ...users.map((u) => [
      u.name ?? "",
      u.email,
      u.phone ?? "",
      (u.bookings.reduce((sum, b) => sum + b.totalCents, 0) / 100).toFixed(2),
      u.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers.csv"`,
    },
  });
}
