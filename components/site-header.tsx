import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-semibold text-primary">
          Summit Shine
        </Link>
        <nav className="flex items-center gap-4">
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
                Sign In
              </Button>
              <Button nativeButton={false} render={<Link href="/register" />}>
                Create Account
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
