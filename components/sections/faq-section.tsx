import { Plus } from "lucide-react";
import Link from "next/link";

import type { SectionData } from "@/lib/site-config";

import { Section, SectionTitle, pillButton } from "./section-shell";

// Native <details>: keyboard and screen-reader friendly with no JavaScript
const FaqSection = ({ data }: { data: SectionData<"faq"> }) => {
  return (
    <Section>
      <div className="grid items-start gap-[clamp(32px,6vw,96px)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <SectionTitle text={data.title} className="text-[clamp(1.75rem,3.4vw,2.75rem)]" />
          {data.intro && <p className="max-w-[36ch] text-muted-foreground">{data.intro}</p>}
          {data.ctaText && data.ctaUrl && (
            <div>
              <Link href={data.ctaUrl} className={pillButton.ghost}>
                {data.ctaText}
              </Link>
            </div>
          )}
        </div>

        <div className="min-w-0 border-t">
          {data.items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold sm:text-lg tracking-[-0.01em] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  <Plus className="size-3.5" />
                </span>
              </summary>

              <p className="mb-6 max-w-[60ch] whitespace-pre-line text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default FaqSection;
