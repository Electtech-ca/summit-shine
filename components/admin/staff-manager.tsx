"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StaffManager({ staff, currentUserId }: { staff: User[]; currentUserId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add staff member.");
      return;
    }

    setEmail("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="staffEmail">Email</Label>
          <Input
            id="staffEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@summitshine.ca"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="staffRole">Role</Label>
          <Select value={role} onValueChange={(v) => setRole((v ?? "STAFF") as Role)}>
            <SelectTrigger id="staffRole" className="w-32">
              <SelectValue>{(v: Role) => (v === "ADMIN" ? "Admin" : "Staff")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add / Promote"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        If the email doesn&apos;t match an existing account, a new one is created with that role — they
        can sign in with Google using this email, or use &quot;Forgot password&quot; once email delivery
        is set up.
      </p>

      <div className="space-y-2">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between border-b py-2 text-sm">
            <div>
              <p className="font-medium">{s.name ?? s.email}</p>
              <p className="text-muted-foreground">{s.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={s.role === "ADMIN" ? "default" : "secondary"}>{s.role}</Badge>
              {s.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(s.id)}
                  disabled={pendingId === s.id}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
