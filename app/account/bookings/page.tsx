import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountBookingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your upcoming and past bookings will show up here once the booking wizard is live.
        </p>
      </CardContent>
    </Card>
  );
}
