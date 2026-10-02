"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  <li className="w-full border-t-2 border-foreground pt-3">
    <p className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] tabular-nums">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
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
    <Section tone="stone">
      <div className="grid items-center gap-[clamp(32px,5vw,80px)] lg:grid-cols-2">
      <div className="flex min-w-0 flex-col justify-center gap-6">
        <h2 className="h-section">{ended ? "This deal has ended" : <AccentText text={title} />}</h2>

        <p className="max-w-[44ch] text-lg text-muted-foreground">
          {ended
            ? "Check out our latest products and promotions."
            : description}
        </p>

        {!ended && (
          // Same layout while loading, so the page doesn't jump
          <ul className="grid max-w-md grid-cols-4 gap-4" aria-label="Time left">
            <StatBox label="Days" value={time?.days ?? 0} />
            <StatBox label="Hours" value={time?.hours ?? 0} />
            <StatBox label="Minutes" value={time?.minutes ?? 0} />
            <StatBox label="Seconds" value={time?.seconds ?? 0} />
          </ul>
        )}

        {ctaText && ctaUrl && (
          <div>
            <Link href={ended ? "/search" : ctaUrl} className={pillButton.dark}>
              {ended ? "View products" : ctaText}
            </Link>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="backdrop-leather aspect-[5/4] min-w-0">
          <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      )}
      </div>
    </Section>
  );
};

export default DealCountdown;
