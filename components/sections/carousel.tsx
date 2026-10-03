"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/*
 * Layout per card type. Kept in here because a client module's plain
 * exports reach server components as references, not values.
 *
 * Phones (below Tailwind's sm, 640px): "center mode" inside the page
 * gutter. --track is the row's width (the screen minus the gutter on each
 * side); cards are a share of it, and side padding of (track - card) / 2
 * lets any card snap to the middle.
 * Larger screens: cards start-aligned, a set number per row.
 */
const LAYOUTS = {
  // Product cards: one in the middle, almost half of each neighbour showing
  products: {
    item: "basis-[calc(var(--track)*0.52)] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-3*20px)/4)]",
    phoneTrack: "max-sm:px-[calc(var(--track)*0.24)]",
    grid: "sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7",
  },
  // Category tiles, same rhythm as products
  tiles: {
    item: "basis-[calc(var(--track)*0.52)] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-3*20px)/4)]",
    phoneTrack: "max-sm:px-[calc(var(--track)*0.24)]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-4",
  },
  // Exactly three category tiles: three across on large screens
  tiles3: {
    item: "basis-[calc(var(--track)*0.52)] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-2*20px)/3)]",
    phoneTrack: "max-sm:px-[calc(var(--track)*0.24)]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-3",
  },
  // Reviews: wider, so the text reads comfortably; a sliver of each side
  reviews: {
    item: "basis-[calc(var(--track)*0.76)] sm:basis-[calc((100%-20px)/2)] lg:basis-[calc((100%-2*20px)/3)]",
    phoneTrack: "max-sm:px-[calc(var(--track)*0.12)]",
    grid: "sm:grid sm:grid-cols-2 lg:grid-cols-3",
  },
  // Photos: smaller squares, more of the neighbours showing
  photos: {
    item: "basis-[calc(var(--track)*0.4)] sm:basis-[calc((100%-2*20px)/3)] lg:basis-[calc((100%-5*20px)/6)]",
    phoneTrack: "max-sm:px-[calc(var(--track)*0.3)]",
    grid: "sm:grid sm:grid-cols-3 lg:grid-cols-6",
  },
} as const;

const PHONE = "(max-width: 639.98px)";

// Copies of the last/first cards placed before/after the real ones, so the
// row can loop on phones
const CLONES = 2;

const arrow =
  "flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const isPhone = () => window.matchMedia(PHONE).matches;

// Index of the card whose middle is closest to the row's middle
function centeredIndex(el: HTMLElement) {
  const middle = el.getBoundingClientRect().left + el.clientWidth / 2;
  let best = 0;
  let distance = Infinity;

  Array.from(el.children).forEach((child, index) => {
    const rect = child.getBoundingClientRect();
    if (rect.width === 0) return;

    const d = Math.abs(rect.left + rect.width / 2 - middle);
    if (d < distance) {
      distance = d;
      best = index;
    }
  });

  return best;
}

function centerOn(el: HTMLElement, index: number, behavior: ScrollBehavior) {
  const child = el.children[index];
  if (!child) return;

  const rect = child.getBoundingClientRect();
  const middle = el.getBoundingClientRect().left + el.clientWidth / 2;
  el.scrollBy({ left: rect.left + rect.width / 2 - middle, behavior });
}

const smooth = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

/*
 * A row of cards that scrolls sideways: swipe on phones, arrows elsewhere.
 * Uses native scrolling with scroll snap, so touch, trackpads and keyboard
 * focus all work without extra code. The arrows and "1 / 3" counter only
 * show when there is more than fits.
 *
 * On phones the row loops: copies of the end cards sit beyond each end,
 * and when a swipe stops on a copy the row jumps, without animation, to
 * the real card it copies. Copies are hidden from assistive technology
 * and can't be focused; on larger screens they aren't shown at all.
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
  const count = items.length;

  const loopable = count >= 2;
  const before = loopable ? Math.min(CLONES, count) : 0;
  const clonesBefore = loopable ? items.slice(-before) : [];
  const clonesAfter = loopable ? items.slice(0, before) : [];

  const track = useRef<HTMLUListElement>(null);
  // Width of one view of whole cards, which is what the arrows scroll by
  const step = useRef(0);
  const [page, setPage] = useState({ current: 1, total: 1, looping: false });
  // Only announced as a carousel while it is one
  const [isCarousel, setIsCarousel] = useState(true);
  // Snapping starts once the row is placed: with it on during page load,
  // the browser can re-snap to a stale position and skip the first card
  const [snapping, setSnapping] = useState(false);

  const looping = useCallback(() => loopable && isPhone(), [loopable]);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;

    const real = el.querySelectorAll<HTMLElement>(":scope > li:not([data-clone])");
    const first = real[0];
    if (!first) return;

    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = first.getBoundingClientRect().width + gap;

    let next: typeof page;

    if (looping()) {
      step.current = card;
      const index = (((centeredIndex(el) - before) % count) + count) % count;
      next = { current: index + 1, total: count, looping: true };
    } else {
      const perView = Math.max(1, Math.floor((el.clientWidth + gap + 1) / card));
      step.current = perView * card;

      const overflows = el.scrollWidth > el.clientWidth + 4;
      const total = overflows ? Math.ceil(real.length / perView) : 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const current = atEnd ? total : Math.min(total, Math.round(el.scrollLeft / step.current) + 1);
      next = { current, total, looping: false };
    }

    setPage((prev) =>
      prev.current === next.current && prev.total === next.total && prev.looping === next.looping ? prev : next,
    );
  }, [before, count, looping]);

  // After a swipe stops on a copy, jump to the real card it copies
  const settle = useCallback(() => {
    const el = track.current;
    if (!el || !looping()) return;

    const index = centeredIndex(el);

    if (index < before) centerOn(el, index + count, "instant");
    else if (index >= before + count) centerOn(el, index - count, "instant");
  }, [before, count, looping]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    const phone = window.matchMedia(PHONE);

    const start = () => {
      if (phoneOnly) setIsCarousel(phone.matches);

      // Phones: the first real card in the middle, the last one peeking left
      if (looping()) centerOn(el, before, "instant");
      else el.scrollTo({ left: 0, behavior: "instant" });

      measure();
      requestAnimationFrame(() => setSnapping(true));
    };

    // Swipes end with scrollend; older browsers get a short pause instead
    const hasScrollEnd: boolean = "onscrollend" in window;
    let timer: number | undefined;
    const onScroll = () => {
      measure();
      if (!hasScrollEnd) {
        window.clearTimeout(timer);
        timer = window.setTimeout(settle, 150);
      }
    };

    start();
    phone.addEventListener("change", start);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", settle);
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      phone.removeEventListener("change", start);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", settle);
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [before, looping, measure, phoneOnly, settle]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;

    if (looping()) {
      centerOn(el, centeredIndex(el) + direction, smooth());
    } else {
      el.scrollBy({ left: direction * (step.current || el.clientWidth), behavior: smooth() });
    }
  };

  const slide = (item: React.ReactNode, key: string, index: number | null) => (
    <li
      key={key}
      // Copies: phones only, invisible to assistive technology, not focusable
      {...(index === null
        ? { "data-clone": "", "aria-hidden": true, inert: true }
        : {
            "aria-roledescription": isCarousel ? "slide" : undefined,
            "aria-label": isCarousel ? `${index + 1} of ${count}` : undefined,
          })}
      className={cn("min-w-0 shrink-0 snap-center sm:snap-start", layout.item, index === null && "sm:hidden")}
    >
      {item}
    </li>
  );

  return (
    <div
      role="region"
      aria-roledescription={isCarousel ? "carousel" : undefined}
      aria-label={label}
      className="flex flex-col gap-6"
    >
      <ul
        ref={track}
        className={cn(
          "-mx-1 flex gap-3 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] motion-reduce:scroll-auto sm:gap-5 [&::-webkit-scrollbar]:hidden",
          // Phones: inside the page gutter, max(16px, 4vw) on each side
          "max-sm:mx-0 max-sm:[--track:calc(100vw-2*max(16px,4vw))]",
          snapping && "snap-x snap-mandatory",
          layout.phoneTrack,
          phoneOnly && cn(layout.grid, "sm:overflow-x-visible sm:snap-none"),
        )}
      >
        {clonesBefore.map((item, index) => slide(item, `before-${index}`, null))}
        {items.map((item, index) => slide(item, `item-${index}`, index))}
        {clonesAfter.map((item, index) => slide(item, `after-${index}`, null))}
      </ul>

      {page.total > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!page.looping && page.current === 1}
            className={arrow}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          <span className="min-w-12 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {page.current} / {page.total}
          </span>

          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!page.looping && page.current === page.total}
            className={arrow}
            aria-label="Next"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
