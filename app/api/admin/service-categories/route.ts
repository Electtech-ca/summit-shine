import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });

  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}
