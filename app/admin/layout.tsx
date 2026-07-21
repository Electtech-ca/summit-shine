import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

const NAV_SECTIONS = [
  {
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    heading: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings & Schedule" },
      { href: "/admin/orders", label: "Orders & Payments" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/services", label: "Services" },
      { href: "/admin/products", label: "Products & Inventory" },
      { href: "/admin/memberships", label: "Memberships" },
      { href: "/admin/discounts", label: "Discounts" },
    ],
  },
  {
    heading: "Site",
    items: [
      { href: "/admin/content", label: "Content / CMS" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/staff", label: "Staff" },
      { href: "/admin/audit-log", label: "Audit Log" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <div>
            <p className="font-display text-lg font-semibold text-primary">Admin</p>
            <p className="text-xs text-muted-foreground">
              {session.user.email} · {session.user.role}
            </p>
          </div>
        </div>
        <nav className="space-y-6">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
