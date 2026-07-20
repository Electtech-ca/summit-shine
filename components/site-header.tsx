import Link from "next/link";
import { auth } from "@/auth";
import { getBusinessName } from "@/lib/business-name";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";

export async function SiteHeader() {
  const [session, businessName] = await Promise.all([auth(), getBusinessName()]);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-semibold text-primary">
          {businessName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/services" className="hover:text-primary">
            Services
          </Link>
          <Link href="/memberships" className="hover:text-primary">
            Memberships
          </Link>
          <Link href="/faq" className="hover:text-primary">
            FAQ
          </Link>
        </nav>
        <nav className="flex items-center gap-3">
          <Button size="sm" nativeButton={false} render={<Link href="/book" />}>
            Book a Wash
          </Button>
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
                Sign In
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/register" />}>
                Create Account
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
