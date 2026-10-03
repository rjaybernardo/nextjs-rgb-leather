import { stripAccents } from "@/components/shared/accent-text";
import { getReviewSummary } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";

import { Carousel } from "./carousel";
import { Section, SectionTitle } from "./section-shell";

const Testimonial = ({ item }: { item: SectionData<"testimonials">["items"][number] }) => (
  <figure className="flex h-full flex-col gap-4 rounded-[var(--radius)] bg-card p-6 sm:p-7">
    <div aria-hidden="true" className="tracking-[2px] text-amber-500">
      ★★★★★
    </div>
    <blockquote className="text-[16px] leading-relaxed">“{item.quote}”</blockquote>
    <figcaption className="mt-auto flex justify-between gap-3 pt-2 text-[13px] text-muted-foreground">
      <span>
        <strong className="font-semibold text-foreground">{item.name}</strong>
        {item.location && ` · ${item.location}`}
      </span>
      {item.product && <span className="text-right">{item.product}</span>}
    </figcaption>
  </figure>
);

const TestimonialsSection = async ({ data }: { data: SectionData<"testimonials"> }) => {
  const summary = data.showSummary === "yes" ? await getReviewSummary() : null;

  return (
    <Section tone="stone" innerClassName="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionTitle text={data.title} className="text-[clamp(1.75rem,3.4vw,2.75rem)]" />

        {summary && summary.count > 0 && (
          <div className="flex min-w-0 items-center gap-7">
            <div>
              <div className="text-[48px] font-bold leading-none tracking-[-0.04em]">
                <span className="sr-only">Average rating </span>
                {summary.average.toFixed(1)}
              </div>
              <div className="mt-1.5 text-[13px] text-muted-foreground">
                {summary.count.toLocaleString("en-PH")} {summary.count === 1 ? "review" : "reviews"}
              </div>
            </div>

            <ul className="flex w-[200px] flex-col gap-1.5 text-xs tabular-nums text-muted-foreground">
              {summary.distribution.map((row) => (
                <li key={row.stars} className="flex items-center gap-2.5">
                  <span aria-hidden="true">{row.stars}</span>
                  <span className="sr-only">
                    {row.stars} stars: {row.count} {row.count === 1 ? "review" : "reviews"}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
                    <span
                      className="block h-full bg-foreground"
                      style={{ width: `${Math.round((row.count / summary.count) * 100)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {data.layout === "carousel" || data.items.length > 1 ? (
        // In grid layout, reviews still swipe on phones instead of stacking
        <Carousel label={stripAccents(data.title)} columns="reviews" phoneOnly={data.layout === "grid"}>
          {data.items.map((item, index) => (
            <Testimonial key={`${item.name}-${index}`} item={item} />
          ))}
        </Carousel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <Testimonial item={item} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

export default TestimonialsSection;
