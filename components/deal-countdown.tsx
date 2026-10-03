"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ImagePlaceholder } from "@/components/sections/image-placeholder";
import { Section, pillButton } from "@/components/sections/section-shell";
import AccentText from "@/components/shared/accent-text";

type DealCountdownProps = {
  title: string;
  description: string;
  // datetime-local value entered in Site Studio, in Philippine time
  endsAt: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
};

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// "2026-12-31T23:59" is Manila time; values with a zone are used as given
const parseEndsAt = (value: string) =>
  new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}:00+08:00`);

const calculateTimeRemaining = (target: Date): TimeRemaining => {
  const difference = Math.max(target.getTime() - Date.now(), 0);

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

const isFinished = (time: TimeRemaining) =>
  time.days + time.hours + time.minutes + time.seconds === 0;

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <li className="flex flex-col items-center rounded-[var(--radius)] bg-[var(--tone-panel)] px-2 py-3">
    <span className="text-[clamp(24px,2.6vw,34px)] font-bold leading-none tracking-[-0.03em] tabular-nums">
      {String(value).padStart(2, "0")}
    </span>
    <span className="mt-1.5 text-xs text-[var(--tone-muted)]">{label}</span>
  </li>
);

const DealCountdown = ({
  title,
  description,
  endsAt,
  imageUrl,
  ctaText,
  ctaUrl,
}: DealCountdownProps) => {
  const [time, setTime] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const target = parseEndsAt(endsAt);
    const update = () => setTime(calculateTimeRemaining(target));

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [endsAt]);

  const ended = time !== null && isFinished(time);

  return (
    <Section innerClassName="py-[clamp(24px,3vw,48px)]">
      <div className="tone-brand grid overflow-hidden rounded-[calc(var(--radius)*2)] bg-[var(--brand)] text-[var(--brand-foreground)] lg:grid-cols-2">
        <div className="flex min-w-0 flex-col justify-center gap-6 p-[clamp(24px,5vw,64px)]">
          <h2 className="h-section text-[clamp(1.75rem,3.6vw,3rem)]">
            {ended ? "This deal has ended" : <AccentText text={title} />}
          </h2>

          <p className="max-w-[44ch] text-[var(--tone-muted)]">
            {ended ? "Check out our latest products and promotions." : description}
          </p>

          {!ended && (
            // Same layout while loading, so the page doesn't jump
            <ul className="grid max-w-sm grid-cols-4 gap-2" aria-label="Time left">
              <StatBox label="Days" value={time?.days ?? 0} />
              <StatBox label="Hours" value={time?.hours ?? 0} />
              <StatBox label="Mins" value={time?.minutes ?? 0} />
              <StatBox label="Secs" value={time?.seconds ?? 0} />
            </ul>
          )}

          {ctaText && ctaUrl && (
            <div>
              <Link href={ended ? "/search" : ctaUrl} className={pillButton.light}>
                {ended ? "View products" : ctaText}
              </Link>
            </div>
          )}
        </div>

        <div className="relative flex aspect-[4/3] min-w-0 items-center justify-center bg-[var(--tone-panel)] lg:aspect-auto lg:min-h-[26rem]">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
      </div>
    </Section>
  );
};

export default DealCountdown;
