import Link from "next/link";
import { getBusinessName } from "@/lib/business-name";
import { LogoMark } from "@/components/logo";

export async function SiteFooter() {
  const businessName = await getBusinessName();

  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span>
            © {new Date().getFullYear()} {businessName} 🍁 British Columbia, Canada
          </span>
        </p>
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
