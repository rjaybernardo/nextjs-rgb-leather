import Image from "next/image";

import type { SectionData } from "@/lib/site-config";

import { ImagePlaceholder } from "./image-placeholder";
import { Section, SectionTitle } from "./section-shell";

// Where the numbered markers sit on the photo, in the order of the points
const MARKERS = [
  "top-[25%] left-[18%]",
  "top-[25%] right-[22%]",
  "bottom-[24%] left-[22%]",
  "bottom-[30%] right-[18%]",
];

// How it's made, on the accent color, with an optional comparison table
const CraftSection = ({ data }: { data: SectionData<"craft"> }) => {
  return (
    <Section tone="brand" id="craft" innerClassName="flex flex-col gap-[clamp(56px,7vw,96px)] py-[clamp(64px,8vw,128px)]">
      <div className="grid items-center gap-[clamp(32px,5vw,80px)] lg:grid-cols-2">
        <div className="relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-md bg-[var(--tone-panel)]">
          {data.imageUrl ? (
            <Image src={data.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <ImagePlaceholder />
          )}

          {data.points.slice(0, MARKERS.length).map((point, index) => (
            <span
              key={`${point.title}-${index}`}
              aria-hidden="true"
              className={`absolute z-[2] flex size-[30px] items-center justify-center rounded-full bg-[var(--brand-foreground)] text-sm font-bold text-[var(--brand)] ${MARKERS[index]}`}
            >
              {index + 1}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <SectionTitle text={data.title} />
          {data.intro && <p className="max-w-[46ch] text-lg text-[var(--tone-muted)]">{data.intro}</p>}

          {data.points.length > 0 && (
            <dl className="border-b border-[var(--tone-line)]">
              {data.points.map((point, index) => (
                <div
                  key={`${point.title}-${index}`}
                  className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-t border-[var(--tone-line)] py-[18px]"
                >
                  <dt className="font-bold text-[var(--tan)]">
                    <span className="sr-only">Point </span>
                    {index + 1}
                  </dt>
                  <dd>
                    <strong className="font-semibold">{point.title}</strong>{" "}
                    {point.text && <span className="text-[var(--tone-muted)]">{point.text}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {data.rows.length > 0 && (
        <div className="flex flex-col gap-6">
          {data.comparisonTitle && (
            <h3 className="text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em]">{data.comparisonTitle}</h3>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px] sm:text-[15px]">
              <thead>
                <tr className="text-left text-[13px]">
                  <th scope="col" className="w-[22%] border-b border-[var(--tone-line)] px-2 py-3 sm:p-3.5">
                    <span className="sr-only">Compared on</span>
                  </th>
                  <th scope="col" className="border-b border-[var(--tone-line)] px-2 py-3 font-semibold sm:p-3.5">
                    {data.ourLabel || "Ours"}
                  </th>
                  <th scope="col" className="border-b border-[var(--tone-line)] px-2 py-3 font-semibold text-[var(--tone-muted)] sm:p-3.5">
                    {data.theirLabel || "Typical"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={`${row.label}-${index}`} className="align-top">
                    <th scope="row" className="border-b border-[var(--tone-line)] px-2 py-3 text-left font-medium text-[var(--tone-muted)] sm:px-3.5 sm:py-4">
                      {row.label}
                    </th>
                    <td className="border-b border-[var(--tone-line)] px-2 py-3 sm:px-3.5 sm:py-4">{row.ours}</td>
                    <td className="border-b border-[var(--tone-line)] px-2 py-3 text-[var(--tone-muted)] sm:px-3.5 sm:py-4">
                      {row.theirs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
};

export default CraftSection;
