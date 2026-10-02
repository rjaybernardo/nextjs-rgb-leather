import { ChevronDown } from "lucide-react";

import type { SectionData } from "@/lib/site-config";

// Native <details>: keyboard and screen-reader friendly with no JavaScript
const FaqSection = ({ data }: { data: SectionData<"faq"> }) => {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h2 className="h2-bold text-center">{data.title}</h2>

      <div className="divide-y rounded-lg border">
        {data.items.map((item, index) => (
          <details key={`${item.question}-${index}`} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.question}
              <ChevronDown
                className="size-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
