import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Profile" },
  { href: "/account/vehicles", label: "Vehicles" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/membership", label: "Membership" },
  { href: "/account/payment-methods", label: "Payment Methods" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 font-display text-3xl font-semibold text-primary">My Account</h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto md:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
