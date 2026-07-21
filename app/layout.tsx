import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getBusinessName } from "@/lib/business-name";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export async function generateMetadata(): Promise<Metadata> {
  const businessName = await getBusinessName();
  const description =
    "Premium car wash, detailing, and membership plans in British Columbia. Shine like a BC morning.";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: businessName, template: `%s | ${businessName}` },
    description,
    openGraph: {
      title: businessName,
      description,
      type: "website",
      locale: "en_CA",
      siteName: businessName,
    },
    twitter: {
      card: "summary",
      title: businessName,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, outfit.variable)}>
      <body className="antialiased font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
