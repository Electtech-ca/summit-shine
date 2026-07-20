import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/admin/revenue-chart";

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [
    todaysBookings,
    revenueBookings,
    activeMembers,
    recentOrders,
    lowStockProducts,
    upcomingBookings,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: todayStart, lt: todayEnd } },
      include: { items: { include: { service: true } }, vehicle: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
      select: { createdAt: true, totalCents: true },
    }),
    prisma.membership.count({ where: { status: "active" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { stockQty: "asc" }, take: 20 }),
    prisma.booking.findMany({
      where: { startsAt: { gte: todayEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { items: { include: { service: true } } },
    }),
  ]);

  const lowStock = lowStockProducts.filter((p) => p.stockQty <= p.lowStockAt);

  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of revenueBookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + b.totalCents);
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, cents]) => ({
    date: date.slice(5),
    revenue: cents / 100,
  }));

  const totalRevenue30d = revenueBookings.reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold text-primary">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Today&apos;s Bookings</p>
            <p className="font-display text-3xl font-semibold">{todaysBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Revenue (30d)</p>
            <p className="font-display text-3xl font-semibold">{formatCentsToCAD(totalRevenue30d)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Members</p>
            <p className="font-display text-3xl font-semibold">{activeMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="font-display text-3xl font-semibold">{lowStock.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysBookings.length === 0 && (
              <p className="text-sm text-muted-foreground">No bookings today.</p>
            )}
            {todaysBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">
                    {new Date(b.startsAt).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}{" "}
                    — {b.items.map((i) => i.service.name).join(", ")}
                  </p>
                  <p className="text-muted-foreground">{b.guestName ?? b.reference}</p>
                </div>
                <Badge variant="secondary">{b.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBookings.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing upcoming.</p>
            )}
            {upcomingBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">
                    {new Date(b.startsAt).toLocaleDateString("en-CA", { dateStyle: "medium" })} —{" "}
                    {b.items.map((i) => i.service.name).join(", ")}
                  </p>
                </div>
                <span className="text-muted-foreground">{formatCentsToCAD(b.totalCents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <span>{o.user?.name ?? o.user?.email ?? "Guest"}</span>
                <span>{formatCentsToCAD(o.totalCents)}</span>
                <Badge variant="secondary">{o.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">All stock levels healthy.</p>
            )}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <span>{p.name}</span>
                <Badge variant="destructive">{p.stockQty} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
