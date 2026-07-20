"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCancel() {
    setCanceling(true);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setCanceling(false);

    if (!res.ok) {
      setMessage(data.error ?? "Could not cancel this booking.");
      return;
    }

    setMessage(data.message);
    router.refresh();
  }

  if (message) {
    return <p className="text-sm text-muted-foreground">{message}</p>;
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCancel} disabled={canceling}>
      {canceling ? "Cancelling..." : "Cancel Booking"}
    </Button>
  );
}
