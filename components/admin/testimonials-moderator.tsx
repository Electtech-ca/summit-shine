"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Testimonial } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TestimonialsModerator({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setApproved(id: string, approved: boolean) {
    setPendingId(id);
    await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  if (testimonials.length === 0) {
    return <p className="text-sm text-muted-foreground">No testimonials yet.</p>;
  }

  return (
    <div className="space-y-3">
      {testimonials.map((t) => (
        <div key={t.id} className="rounded-md border border-border p-3 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium">
              {t.author} — {t.rating}★
            </p>
            <Badge variant={t.approved ? "default" : "secondary"}>
              {t.approved ? "Approved" : "Pending"}
            </Badge>
          </div>
          <p className="mb-2 text-muted-foreground">&ldquo;{t.body}&rdquo;</p>
          <div className="flex gap-2">
            {!t.approved && (
              <Button size="sm" onClick={() => setApproved(t.id, true)} disabled={pendingId === t.id}>
                Approve
              </Button>
            )}
            {t.approved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setApproved(t.id, false)}
                disabled={pendingId === t.id}
              >
                Unapprove
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => remove(t.id)} disabled={pendingId === t.id}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
