import { Quote } from "lucide-react";

import type { SectionData } from "@/lib/site-config";

const TestimonialsSection = ({ data }: { data: SectionData<"testimonials"> }) => {
  return (
    <section className="space-y-4">
      <h2 className="h2-bold">{data.title}</h2>

      <ul className="grid gap-4 md:grid-cols-3">
        {data.items.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            <figure className="flex h-full flex-col gap-4 rounded-lg border bg-card p-6">
              <Quote className="size-6 text-primary" aria-hidden="true" />

              <blockquote className="flex-1 text-sm">“{item.quote}”</blockquote>

              <figcaption className="text-sm">
                <span className="font-semibold">{item.name}</span>
                {item.location && <span className="text-muted-foreground"> · {item.location}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TestimonialsSection;
