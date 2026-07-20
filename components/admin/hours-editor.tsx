"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessHours } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayRow = { dayOfWeek: number; openTime: string | null; closeTime: string | null; closed: boolean };

export function HoursEditor({ hours }: { hours: BusinessHours[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<DayRow[]>(() =>
    Array.from({ length: 7 }, (_, dayOfWeek) => {
      const existing = hours.find((h) => h.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        openTime: existing?.openTime ?? "08:00",
        closeTime: existing?.closeTime ?? "19:00",
        closed: existing?.closed ?? false,
      };
    }),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateRow(dayOfWeek: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/hours", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: rows }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.dayOfWeek} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="w-24 shrink-0">{DAY_LABELS[row.dayOfWeek]}</span>
          <label className="flex items-center gap-1.5">
            <Checkbox
              checked={row.closed}
              onCheckedChange={(c) => updateRow(row.dayOfWeek, { closed: c === true })}
            />
            Closed
          </label>
          {!row.closed && (
            <>
              <Input
                type="time"
                className="w-32"
                value={row.openTime ?? ""}
                onChange={(e) => updateRow(row.dayOfWeek, { openTime: e.target.value })}
              />
              <span>to</span>
              <Input
                type="time"
                className="w-32"
                value={row.closeTime ?? ""}
                onChange={(e) => updateRow(row.dayOfWeek, { closeTime: e.target.value })}
              />
            </>
          )}
        </div>
      ))}
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Hours"}
      </Button>
      {saved && <span className="ml-2 text-sm text-accent">Saved.</span>}
    </div>
  );
}
