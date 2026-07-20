import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Signed in as {session?.user?.email} ({session?.user?.role}). Dashboard, bookings,
            services, and the rest of the CMS modules land in a later build step.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
