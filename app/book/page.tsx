import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBookingSettings } from "@/lib/booking-settings";
import { getMemberDetailDiscountPct } from "@/lib/member-discount";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata = {
  title: "Book a Wash",
  description: "Book your car wash or detailing appointment online in minutes.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const session = await auth();

  const [categories, vehicles, settings, memberDetailDiscountPct] = await Promise.all([
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
    getMemberDetailDiscountPct(session?.user?.id),
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
        memberDetailDiscountPct={memberDetailDiscountPct}
      />
    </div>
  );
}
