"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

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
  <li className="w-full p-4 text-center">
    <p className="text-3xl font-bold tabular-nums">{value}</p>
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
    <section className="my-20 grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="flex flex-col justify-center gap-4">
        <h2 className="text-3xl font-bold">{ended ? "This deal has ended" : title}</h2>

        <p className="text-muted-foreground">
          {ended
            ? "Check out our latest products and promotions."
            : description}
        </p>

        {!ended && (
          // Same layout while loading, so the page doesn't jump
          <ul className="grid grid-cols-4" aria-label="Time left">
            <StatBox label="Days" value={time?.days ?? 0} />
            <StatBox label="Hours" value={time?.hours ?? 0} />
            <StatBox label="Minutes" value={time?.minutes ?? 0} />
            <StatBox label="Seconds" value={time?.seconds ?? 0} />
          </ul>
        )}

        {ctaText && ctaUrl && (
          <div>
            <Link href={ended ? "/search" : ctaUrl} className={buttonVariants()}>
              {ended ? "View products" : ctaText}
            </Link>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={title}
            width={480}
            height={320}
            className="h-auto w-auto max-w-full rounded-lg"
          />
        </div>
      )}
    </section>
  );
};

export default DealCountdown;
