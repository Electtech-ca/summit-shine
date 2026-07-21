import Link from "next/link";
import { auth } from "@/auth";
import { getBusinessName } from "@/lib/business-name";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { CartLink } from "@/components/cart/cart-link";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const [session, businessName] = await Promise.all([auth(), getBusinessName()]);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex min-w-9 shrink items-center overflow-hidden">
          <Logo
            businessName={businessName}
            iconClassName="h-8 w-8 sm:h-9 sm:w-9"
            textClassName="hidden sm:block sm:text-base lg:text-lg"
          />
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
          <CartLink />
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
