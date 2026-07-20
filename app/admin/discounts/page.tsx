import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discount.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-primary">Discounts</h1>
        <Button nativeButton={false} render={<Link href="/admin/discounts/new" />}>
          New Discount
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    {d.code ? (
                      <span className="font-mono text-sm">{d.code}</span>
                    ) : (
                      <span className="text-muted-foreground">Automatic</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {d.type === "PERCENTAGE" ? `${d.valuePct}%` : `$${((d.valueCents ?? 0) / 100).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {d.usedCount}
                    {d.maxUses ? ` / ${d.maxUses}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.active ? "default" : "secondary"}>
                      {d.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/discounts/${d.id}`} />}
                    >
                      Edit
                    </Button>
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
