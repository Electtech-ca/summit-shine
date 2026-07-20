import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

export default async function AccountBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { service: true } }, vehicle: true },
    orderBy: { startsAt: "desc" },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bookings</CardTitle>
        <Button size="sm" nativeButton={false} render={<Link href="/book" />}>
          Book Again
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/book" className="text-primary hover:underline">
              Book your first wash
            </Link>
            .
          </p>
        )}
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm text-muted-foreground">{booking.reference}</p>
                <p className="font-medium">
                  {new Date(booking.startsAt).toLocaleString("en-CA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[booking.status] ?? "secondary"}>{booking.status}</Badge>
            </div>
            <ul className="mt-2 text-sm text-muted-foreground">
              {booking.items.map((item) => (
                <li key={item.id}>{item.service.name}</li>
              ))}
            </ul>
            {booking.vehicle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {booking.vehicle.make} {booking.vehicle.model}
              </p>
            )}
            <p className="mt-2 font-semibold">{formatCentsToCAD(booking.totalCents)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
