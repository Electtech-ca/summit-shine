import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Summit Shine Car Wash & Detail Co. 🍁 British Columbia, Canada</p>
        <nav className="flex gap-4">
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
          <Link href="/memberships" className="hover:text-foreground">
            Memberships
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
