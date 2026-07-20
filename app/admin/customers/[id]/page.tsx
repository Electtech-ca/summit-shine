import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      vehicles: true,
      bookings: { include: { items: { include: { service: true } } }, orderBy: { startsAt: "desc" } },
      membership: { include: { plan: true } },
    },
  });
  if (!user) notFound();

  const lifetimeSpend = user.bookings.reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">{user.name ?? user.email}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lifetime Spend</p>
            <p className="font-display text-2xl font-semibold">{formatCentsToCAD(lifetimeSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Membership</p>
            <p className="font-display text-2xl font-semibold">
              {user.membership?.plan.name ?? "None"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="font-display text-2xl font-semibold">{user.bookings.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.vehicles.length === 0 && <p className="text-sm text-muted-foreground">None saved.</p>}
          {user.vehicles.map((v) => (
            <p key={v.id} className="text-sm">
              {v.make} {v.model} — {v.size} {v.plate ? `· ${v.plate}` : ""}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.bookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
          {user.bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between border-b pb-2 text-sm">
              <div>
                <p className="font-medium">{b.items.map((i) => i.service.name).join(", ")}</p>
                <p className="text-muted-foreground">
                  {new Date(b.startsAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatCentsToCAD(b.totalCents)}</span>
                <Badge variant="secondary">{b.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
