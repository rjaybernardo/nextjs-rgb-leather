"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 50;

const control =
  "flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/*
 * Banner slides, one at a time. Slides out of view are inert, so keyboard
 * and screen-reader users only meet the visible one. Autoplay pauses on
 * hover and focus, has a pause button, and stays off for visitors who ask
 * for reduced motion.
 */
export default function HeroCarousel({
  label,
  autoplay,
  children,
}: {
  label: string;
  autoplay: boolean;
  children: React.ReactNode;
}) {
  const slides = Children.toArray(children);
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  const playing = autoplay && !stopped && !reducedMotion;

  useEffect(() => {
    if (!playing || hovered || focused || count < 2) return;

    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [playing, hovered, focused, count, index]);

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="flex flex-col gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="overflow-hidden"
        onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;

          const distance = event.changedTouches[0].clientX - touchStart.current;
          touchStart.current = null;

          if (Math.abs(distance) > SWIPE_PX) go(index + (distance < 0 ? 1 : -1));
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={playing && !hovered && !focused ? "off" : "polite"}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={slideIndex}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count}`}
              inert={slideIndex !== index}
              className="w-full min-w-0 shrink-0"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(index - 1)} className={control} aria-label="Previous slide">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => go(dotIndex)}
              aria-label={`Show slide ${dotIndex + 1}`}
              aria-current={dotIndex === index ? "true" : undefined}
              className="flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all motion-reduce:transition-none",
                  dotIndex === index ? "w-6 bg-[var(--brand-ink)]" : "w-2 bg-[var(--line)]",
                )}
              />
            </button>
          ))}
        </div>

        <button type="button" onClick={() => go(index + 1)} className={control} aria-label="Next slide">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>

        {autoplay && !reducedMotion && (
          <button
            type="button"
            onClick={() => setStopped((value) => !value)}
            className={control}
            aria-label={stopped ? "Play slideshow" : "Pause slideshow"}
          >
            {stopped ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
