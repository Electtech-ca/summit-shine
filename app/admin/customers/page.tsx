import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToCAD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      bookings: { select: { totalCents: true } },
      membership: { include: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-primary">Customers</h1>
        <Button variant="outline" nativeButton={false} render={<a href="/api/admin/customers/export" />}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{users.length} Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Lifetime Spend</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const lifetimeSpend = u.bookings.reduce((sum, b) => sum + b.totalCents, 0);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.membership ? (
                        <Badge variant={u.membership.status === "active" ? "default" : "secondary"}>
                          {u.membership.plan.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCentsToCAD(lifetimeSpend)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/customers/${u.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
