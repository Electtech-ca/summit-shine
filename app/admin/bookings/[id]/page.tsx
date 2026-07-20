import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusPanel } from "@/components/admin/booking-status-panel";

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { items: { include: { service: true } }, vehicle: true, user: true, discount: true },
  });
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">{booking.reference}</h1>
        <p className="text-muted-foreground">
          {new Date(booking.startsAt).toLocaleString("en-CA", { dateStyle: "full", timeStyle: "short" })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p>{booking.user?.name ?? booking.user?.email ?? booking.guestName}</p>
              {booking.guestEmail && <p className="text-muted-foreground">{booking.guestEmail}</p>}
              {booking.guestPhone && <p className="text-muted-foreground">{booking.guestPhone}</p>}
            </div>
            {booking.vehicle && (
              <div>
                <p className="text-muted-foreground">Vehicle</p>
                <p>
                  {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.size})
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Services</p>
              <ul className="list-inside list-disc">
                {booking.items.map((item) => (
                  <li key={item.id}>{item.service.name}</li>
                ))}
              </ul>
            </div>
            {booking.notes && (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p>{booking.notes}</p>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCentsToCAD(booking.subtotalCents)}</span>
              </div>
              {booking.discountCents > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount{booking.discount ? ` (${booking.discount.name})` : ""}</span>
                  <span>-{formatCentsToCAD(booking.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCentsToCAD(booking.taxCents)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCentsToCAD(booking.totalCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <BookingStatusPanel
          bookingId={booking.id}
          status={booking.status}
          paymentStatus={booking.paymentStatus}
          totalCents={booking.totalCents}
          hasPaymentIntent={!!booking.stripePaymentIntentId}
        />
      </div>
    </div>
  );
}
