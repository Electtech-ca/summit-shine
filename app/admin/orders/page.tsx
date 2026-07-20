import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminOrdersPage() {
  const [orders, paidBookings] = await Promise.all([
    prisma.order.findMany({
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { paymentStatus: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Orders &amp; Payments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Product Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No product orders yet — retail checkout lands with the cart in a later step.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.user?.name ?? o.user?.email ?? "Guest"}</TableCell>
                    <TableCell>{o.items.map((i) => i.product.name).join(", ")}</TableCell>
                    <TableCell>{formatCentsToCAD(o.totalCents)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {paidBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.reference}</TableCell>
                  <TableCell>{b.user?.name ?? b.user?.email ?? b.guestName}</TableCell>
                  <TableCell>{formatCentsToCAD(b.totalCents)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{b.paymentStatus}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
