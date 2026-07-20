"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Settings = {
  businessName: string;
  gstPct: number;
  pstPct: number;
  bookingLeadTimeMin: number;
  maxAdvanceBookingDays: number;
  slotCapacity: number;
  bufferMinutes: number;
  depositPct: number;
  cancellationWindowHours: number;
  payAtLocationEnabled: boolean;
  smsRemindersEnabled: boolean;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save settings.");
      return;
    }

    setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstPct">GST %</Label>
              <Input
                id="gstPct"
                type="number"
                step="0.1"
                value={settings.gstPct}
                onChange={(e) => set("gstPct", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pstPct">PST %</Label>
              <Input
                id="pstPct"
                type="number"
                step="0.1"
                value={settings.pstPct}
                onChange={(e) => set("pstPct", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leadTime">Lead Time (minutes)</Label>
            <Input
              id="leadTime"
              type="number"
              value={settings.bookingLeadTimeMin}
              onChange={(e) => set("bookingLeadTimeMin", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAdvance">Max Advance Booking (days)</Label>
            <Input
              id="maxAdvance"
              type="number"
              value={settings.maxAdvanceBookingDays}
              onChange={(e) => set("maxAdvanceBookingDays", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slotCapacity">Slot Capacity (bays/staff)</Label>
            <Input
              id="slotCapacity"
              type="number"
              value={settings.slotCapacity}
              onChange={(e) => set("slotCapacity", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffer">Buffer (minutes)</Label>
            <Input
              id="buffer"
              type="number"
              value={settings.bufferMinutes}
              onChange={(e) => set("bufferMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depositPct">Deposit %</Label>
            <Input
              id="depositPct"
              type="number"
              value={settings.depositPct}
              onChange={(e) => set("depositPct", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
            <Input
              id="cancellationWindow"
              type="number"
              value={settings.cancellationWindowHours}
              onChange={(e) => set("cancellationWindowHours", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              id="payAtLocation"
              checked={settings.payAtLocationEnabled}
              onCheckedChange={(c) => set("payAtLocationEnabled", c)}
            />
            <Label htmlFor="payAtLocation">Allow pay-at-location</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="smsReminders"
              checked={settings.smsRemindersEnabled}
              onCheckedChange={(c) => set("smsRemindersEnabled", c)}
            />
            <Label htmlFor="smsReminders">SMS reminders (requires Twilio setup)</Label>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saved && <span className="text-sm text-accent">Saved.</span>}
      </div>
    </form>
  );
}
