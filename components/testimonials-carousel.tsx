import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

type Testimonial = {
  id: string;
  author: string;
  body: string;
  rating: number;
};

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-4">
      {testimonials.map((t) => (
        <Card key={t.id} className="w-80 shrink-0 snap-start">
          <CardContent className="space-y-3 pt-6">
            <div className="flex gap-0.5 text-cedar">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">&ldquo;{t.body}&rdquo;</p>
            <p className="text-sm font-semibold">{t.author}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
