"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

const TARGET_DATE = new Date("2026-12-31T23:59:59");

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const calculateTimeRemaining = (targetDate: Date): TimeRemaining => {
  const currentTime = new Date();

  const timeDifference = Math.max(
    targetDate.getTime() - currentTime.getTime(),
    0,
  );

  return {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    ),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  };
};

const isCountdownFinished = (time: TimeRemaining) =>
  time.days === 0 &&
  time.hours === 0 &&
  time.minutes === 0 &&
  time.seconds === 0;

const StatBox = ({ label, value }: { label: string; value: number }) => {
  return (
    <li className="w-full p-4 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </li>
  );
};

const DealCountdown = () => {
  const [time, setTime] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      setTime(calculateTimeRemaining(TARGET_DATE));
    };

    updateCountdown();

    const timerInterval = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(timerInterval);
    };
  }, []);

  if (!time) {
    return (
      <section className="my-20 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-2">
          <h3 className="text-3xl font-bold">Loading Countdown...</h3>
        </div>

        <div className="flex justify-center">
          <Image
            src="/images/promo.jpg"
            alt="Promotion"
            width={300}
            height={200}
            className="h-auto w-auto"
            priority
          />
        </div>
      </section>
    );
  }

  if (isCountdownFinished(time)) {
    return (
      <section className="my-20 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4">
          <h3 className="text-3xl font-bold">Deal Has Ended</h3>

          <p className="text-muted-foreground">
            This deal is no longer available. Check out our latest products and
            promotions.
          </p>

          <div>
            <Link href="/search" className={buttonVariants()}>
              View Products
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <Image
            src="/images/promo.jpg"
            alt="Promotion"
            width={300}
            height={200}
            className="h-auto w-auto"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="my-20 grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="flex flex-col justify-center gap-4">
        <h3 className="text-3xl font-bold">Deal Of The Month</h3>

        <p className="text-muted-foreground">
          Get ready for a shopping experience like never before with our Deals
          of the Month! Every purchase comes with exclusive perks and offers,
          making this month a celebration of savvy choices and amazing deals.
          Don&apos;t miss out!
        </p>

        <ul className="grid grid-cols-4">
          <StatBox label="Days" value={time.days} />
          <StatBox label="Hours" value={time.hours} />
          <StatBox label="Minutes" value={time.minutes} />
          <StatBox label="Seconds" value={time.seconds} />
        </ul>

        <div>
          <Link href="/search" className={buttonVariants()}>
            View Products
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Image
          src="/images/promo.jpg"
          alt="Promotion"
          width={300}
          height={200}
          className="h-auto w-auto"
        />
      </div>
    </section>
  );
};

export default DealCountdown;
