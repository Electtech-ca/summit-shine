import Link from "next/link";
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
import { WalkInForm } from "@/components/admin/walk-in-form";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

export default async function AdminBookingsPage() {
  const [bookings, categories] = await Promise.all([
    prisma.booking.findMany({
      include: { items: { include: { service: true } } },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
    prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Bookings &amp; Schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle>Walk-in Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
          <WalkInForm categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.reference}</TableCell>
                  <TableCell>
                    {new Date(b.startsAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell>{b.guestName ?? "Account holder"}</TableCell>
                  <TableCell>{b.items.map((i) => i.service.name).join(", ")}</TableCell>
                  <TableCell>{formatCentsToCAD(b.totalCents)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[b.status] ?? "secondary"}>{b.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{b.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/bookings/${b.id}`} className="text-sm text-primary hover:underline">
                      Manage
                    </Link>
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
