"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlackoutDate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BlackoutDatesManager({ dates }: { dates: BlackoutDate[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/admin/blackout-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason: reason || undefined }),
    });
    setSubmitting(false);
    setDate("");
    setReason("");
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/blackout-dates/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="max-w-xs"
        />
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="space-y-1">
        {dates
          .slice()
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((d) => (
            <div key={d.id} className="flex items-center justify-between border-b py-1 text-sm">
              <span>
                {new Date(d.date).toLocaleDateString("en-CA", { dateStyle: "medium" })}
                {d.reason ? ` — ${d.reason}` : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(d.id)}
                disabled={pendingId === d.id}
              >
                Remove
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}
