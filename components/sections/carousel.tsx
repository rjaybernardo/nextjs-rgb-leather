"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/*
 * Layout per card type. Kept in here because a client module's plain
 * exports reach server components as references, not values.
 *
 * Phones (below Tailwind's sm, 640px): "center mode". The row runs edge to
 * edge, each card snaps to the middle, and side padding of
 * (100vw - card) / 2 lets the first and last cards reach the middle too.
 * Larger screens: cards start-aligned, a set number per row.
 */
const LAYOUTS = {
  // Product cards: one in the middle, almost half of each neighbour showing
  products: {
    item: "basis-[52vw] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-3*20px)/4)]",
    phoneTrack: "max-sm:px-[24vw]",
    grid: "sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7",
  },
  // Category tiles, same rhythm as products
  tiles: {
    item: "basis-[52vw] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-3*20px)/4)]",
    phoneTrack: "max-sm:px-[24vw]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-4",
  },
  // Exactly three category tiles: three across on large screens
  tiles3: {
    item: "basis-[52vw] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-2*20px)/3)]",
    phoneTrack: "max-sm:px-[24vw]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-3",
  },
  // Reviews: wider, so the text reads comfortably; a sliver of each side
  reviews: {
    item: "basis-[76vw] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-2*20px)/3)]",
    phoneTrack: "max-sm:px-[12vw]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-3",
  },
  // Photos: smaller squares, more of the neighbours showing
  photos: {
    item: "basis-[40vw] sm:basis-[calc((100%-2*20px)/3)] lg:basis-[calc((100%-5*20px)/6)]",
    phoneTrack: "max-sm:px-[30vw]",
    grid: "sm:grid sm:grid-cols-3 lg:grid-cols-6",
  },
} as const;

const PHONE = "(max-width: 639.98px)";

const arrow =
  "flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/*
 * A row of cards that scrolls sideways: swipe on phones, arrows elsewhere.
 * Uses native scrolling with scroll snap, so touch, trackpads and keyboard
 * focus all work without extra code. The arrows and "1 / 3" counter only
 * show when there is more than fits.
 *
 * phoneOnly: swipe on phones, a plain grid from tablets up.
 */
export function Carousel({
  label,
  columns,
  phoneOnly = false,
  children,
}: {
  label: string;
  // The kind of card, which sets widths and the tablet/desktop grid
  columns: keyof typeof LAYOUTS;
  phoneOnly?: boolean;
  children: React.ReactNode;
}) {
  const layout = LAYOUTS[columns];
  const items = Children.toArray(children);

  const track = useRef<HTMLUListElement>(null);
  // Width of one view of whole cards, which is what the arrows scroll by
  const step = useRef(0);
  const [page, setPage] = useState({ current: 1, total: 1 });
  // Only announced as a carousel while it is one
  const [isCarousel, setIsCarousel] = useState(true);

  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.firstElementChild;
    if (!el || !first) return;

    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = first.getBoundingClientRect().width + gap;
    // Center mode on phones moves one card at a time
    const perView = window.matchMedia(PHONE).matches
      ? 1
      : Math.max(1, Math.floor((el.clientWidth + gap + 1) / card));
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

    const phone = window.matchMedia(PHONE);
    const update = () => {
      if (phoneOnly) setIsCarousel(phone.matches);
      measure();
    };

    // On phones, start on the second card so one peeks in on each side
    if (phone.matches && el.children.length >= 3) {
      const second = el.children[1] as HTMLElement;
      el.scrollTo({ left: second.offsetLeft - (el.clientWidth - second.offsetWidth) / 2, behavior: "instant" });
    }

    update();
    phone.addEventListener("change", update);
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      phone.removeEventListener("change", update);
      observer.disconnect();
    };
  }, [measure, phoneOnly]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (step.current || el.clientWidth), behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div
      role="region"
      aria-roledescription={isCarousel ? "carousel" : undefined}
      aria-label={label}
      className="flex flex-col gap-6"
    >
      <ul
        ref={track}
        onScroll={measure}
        className={cn(
          "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] motion-reduce:scroll-auto sm:gap-5 [&::-webkit-scrollbar]:hidden",
          // Phones: edge to edge (cancels the page gutter, max(16px, 4vw) there)
          "max-sm:mx-[calc(-1*max(16px,4vw))]",
          layout.phoneTrack,
          phoneOnly && cn(layout.grid, "sm:overflow-x-visible sm:snap-none"),
        )}
      >
        {items.map((item, index) => (
          <li
            key={index}
            aria-roledescription={isCarousel ? "slide" : undefined}
            aria-label={isCarousel ? `${index + 1} of ${items.length}` : undefined}
            className={cn("min-w-0 shrink-0 snap-center sm:snap-start", layout.item)}
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
