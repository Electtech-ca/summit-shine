import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialsModerator } from "@/components/admin/testimonials-moderator";
import { FaqManager } from "@/components/admin/faq-manager";
import { HoursEditor } from "@/components/admin/hours-editor";
import { BlackoutDatesManager } from "@/components/admin/blackout-dates-manager";

export default async function AdminContentPage() {
  const [testimonials, faqs, hours, blackoutDates] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.faq.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.businessHours.findMany(),
    prisma.blackoutDate.findMany({ orderBy: { date: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Content / CMS</h1>

      <Card>
        <CardHeader>
          <CardTitle>Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <TestimonialsModerator testimonials={testimonials} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <FaqManager faqs={faqs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <HoursEditor hours={hours} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holiday / Blackout Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <BlackoutDatesManager dates={blackoutDates} />
        </CardContent>
      </Card>
    </div>
  );
}
