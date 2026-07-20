import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations/vehicle";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: session.user.id,
      make: parsed.data.make,
      model: parsed.data.model,
      colour: parsed.data.colour || null,
      plate: parsed.data.plate || null,
      size: parsed.data.size,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
