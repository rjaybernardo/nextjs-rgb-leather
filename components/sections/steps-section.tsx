import Link from "next/link";

import type { SectionData } from "@/lib/site-config";

import { Section, SectionTitle, pillButton } from "./section-shell";

const StepsSection = ({ data }: { data: SectionData<"steps"> }) => {
  return (
    <Section id="custom" innerClassName="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle text={data.title} className="max-w-[16ch]" />
        {data.intro && <p className="max-w-[40ch] text-muted-foreground">{data.intro}</p>}
      </div>

      <ol className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
        {data.steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="flex flex-col gap-3.5 border-t-2 border-foreground pt-5">
            <span className="text-sm font-bold text-muted-foreground">Step {index + 1}</span>
            <h3 className="text-[clamp(18px,1.8vw,22px)] font-semibold tracking-[-0.02em]">{step.title}</h3>
            {step.text && <p className="text-[15px] text-muted-foreground">{step.text}</p>}
          </li>
        ))}
      </ol>

      {data.ctaText && data.ctaUrl && (
        <div>
          <Link href={data.ctaUrl} className={pillButton.dark}>
            {data.ctaText}
          </Link>
        </div>
      )}
    </Section>
  );
};

export default StepsSection;
