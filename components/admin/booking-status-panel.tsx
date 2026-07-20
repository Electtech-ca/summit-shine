"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { formatCentsToCAD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "DEPOSIT_PAID",
  "PAID",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

export function BookingStatusPanel({
  bookingId,
  status,
  paymentStatus,
  totalCents,
  hasPaymentIntent,
}: {
  bookingId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalCents: number;
  hasPaymentIntent: boolean;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus);
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateBooking(data: Partial<{ status: BookingStatus; paymentStatus: PaymentStatus }>) {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not update booking.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function handleRefund() {
    setRefunding(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    setRefunding(false);
    if (!res.ok) {
      setError(data.error ?? "Could not process refund.");
      return;
    }
    setMessage("Refund issued.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status &amp; Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Booking Status</p>
          <Select
            value={currentStatus}
            onValueChange={(v) => {
              if (!v) return;
              setCurrentStatus(v as BookingStatus);
              updateBooking({ status: v as BookingStatus });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Payment Status</p>
          <Select
            value={currentPaymentStatus}
            onValueChange={(v) => {
              if (!v) return;
              setCurrentPaymentStatus(v as PaymentStatus);
              updateBooking({ paymentStatus: v as PaymentStatus });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasPaymentIntent && currentPaymentStatus === "PAID" && (
          <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
            {refunding ? "Processing..." : `Refund ${formatCentsToCAD(totalCents)}`}
          </Button>
        )}

        {saving && <p className="text-sm text-muted-foreground">Saving...</p>}
        {message && <p className="text-sm text-accent">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
