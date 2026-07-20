"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Member = {
  id: string;
  status: string;
  user: { name: string | null; email: string };
  plan: { name: string };
};

export function MembersList({ members }: { members: Member[] }) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setCancelingId(id);
    await fetch(`/api/admin/memberships/${id}/cancel`, { method: "POST" });
    setCancelingId(null);
    router.refresh();
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{m.user.name ?? m.user.email}</TableCell>
            <TableCell>{m.plan.name}</TableCell>
            <TableCell>
              <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge>
            </TableCell>
            <TableCell>
              {m.status !== "canceled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(m.id)}
                  disabled={cancelingId === m.id}
                >
                  {cancelingId === m.id ? "Canceling..." : "Cancel"}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
