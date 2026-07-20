import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookingSettings } from "@/lib/booking-settings";
import { BookingWizard } from "@/components/booking/booking-wizard";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const session = await auth();

  const [categories, vehicles, settings] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        services: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: { sizeModifiers: true },
        },
      },
    }),
    session?.user
      ? prisma.vehicle.findMany({ where: { userId: session.user.id } })
      : Promise.resolve([]),
    getBookingSettings(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 font-display text-4xl font-semibold text-primary">Book a Wash</h1>
      <p className="mb-8 text-muted-foreground">
        Pick your services, vehicle, and a time that works.
      </p>
      <BookingWizard
        categories={categories}
        vehicles={vehicles}
        settings={settings}
        isSignedIn={!!session?.user}
        preselectedServiceSlug={searchParams.service}
        publishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
      />
    </div>
  );
}
