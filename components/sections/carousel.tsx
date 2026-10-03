"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Card widths: how many fit per row at each breakpoint, with the gap.
// Kept in here because a client module's plain exports reach server
// components as references, not values.
const COLUMNS = {
  three: "basis-[86%] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-2*20px)/3)]",
  four: "basis-[78%] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-3*20px)/4)]",
  six: "basis-[44%] sm:basis-[calc((100%-2*20px)/3)] lg:basis-[calc((100%-5*20px)/6)]",
} as const;

const arrow =
  "flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/*
 * A row of cards that scrolls sideways: swipe on phones, arrows elsewhere.
 * Uses native scrolling with scroll snap, so touch, trackpads and keyboard
 * focus all work without extra code. The arrows and "1 / 3" counter only
 * show when there is more than fits.
 */
export function Carousel({
  label,
  columns,
  children,
}: {
  label: string;
  // How many cards show per row on large screens
  columns: keyof typeof COLUMNS;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);
  // Width of one view of whole cards, which is what the arrows scroll by
  const step = useRef(0);
  const [page, setPage] = useState({ current: 1, total: 1 });
  const items = Children.toArray(children);

  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.firstElementChild;
    if (!el || !first) return;

    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = first.getBoundingClientRect().width + gap;
    const perView = Math.max(1, Math.floor((el.clientWidth + gap + 1) / card));
    step.current = perView * card;

    const overflows = el.scrollWidth > el.clientWidth + 4;
    const total = overflows ? Math.ceil(el.children.length / perView) : 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const current = atEnd ? total : Math.min(total, Math.round(el.scrollLeft / step.current) + 1);

    setPage((prev) => (prev.current === current && prev.total === total ? prev : { current, total }));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [measure]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (step.current || el.clientWidth), behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-6">
      <ul
        ref={track}
        onScroll={measure}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] motion-reduce:scroll-auto sm:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <li
            key={index}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            className={cn("min-w-0 shrink-0 snap-start", COLUMNS[columns])}
          >
            {item}
          </li>
        ))}
      </ul>

      {page.total > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => scroll(-1)} disabled={page.current === 1} className={arrow} aria-label="Previous">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          <span className="min-w-12 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {page.current} / {page.total}
          </span>

          <button type="button" onClick={() => scroll(1)} disabled={page.current === page.total} className={arrow} aria-label="Next">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
