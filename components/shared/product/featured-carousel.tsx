"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  banner: string;
};

const AUTOPLAY_MS = 6000;

const FeaturedCarousel = ({ products }: { products: FeaturedProduct[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = products.length;

  useEffect(() => {
    if (count < 2 || paused) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured products"
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {products.map((product, slideIndex) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="relative block aspect-[21/9] w-full shrink-0 md:aspect-[3/1]"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${count}: ${product.name}`}
            aria-hidden={slideIndex !== index}
            tabIndex={slideIndex === index ? 0 : -1}
          >
            <Image
              src={product.banner}
              alt={product.name}
              fill
              sizes="100vw"
              priority={slideIndex === 0}
              className="object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-8">
              <p className="text-lg font-bold text-white md:text-3xl">
                {product.name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Next slide"
          >
            <ChevronRight />
          </button>

          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
            {products.map((product, dotIndex) => (
              <button
                key={product.id}
                type="button"
                onClick={() => go(dotIndex)}
                className={cn(
                  "size-2.5 rounded-full bg-white/50",
                  dotIndex === index && "bg-white",
                )}
                aria-label={`Show slide ${dotIndex + 1}`}
                aria-current={dotIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default FeaturedCarousel;
