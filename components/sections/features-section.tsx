import {
  Award,
  BadgeCheck,
  Clock,
  Gift,
  Hammer,
  Headset,
  Leaf,
  Package,
  RotateCcw,
  Ruler,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stamp,
  Truck,
  WalletCards,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { FEATURE_ICONS, SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { Section, SectionTitle } from "./section-shell";

const ICONS: Record<(typeof FEATURE_ICONS)[number], LucideIcon> = {
  ShoppingBag,
  Truck,
  Wrench,
  Stamp,
  Scissors,
  Ruler,
  Package,
  Clock,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
  WalletCards,
  Headset,
  Gift,
  Award,
  Hammer,
  Leaf,
  Sparkles,
};

const FeaturesSection = ({ data }: { data: SectionData<"features"> }) => {
  const strip = data.style === "strip";

  return (
    <Section>
      {data.title && <SectionTitle text={data.title} className="mb-10 text-[clamp(1.75rem,3.4vw,2.75rem)]" />}

      <ul
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-6 text-sm lg:grid-cols-4",
          strip ? "border-y py-6 sm:py-7" : "rounded-[var(--radius)] border bg-card p-6 md:p-8",
        )}
      >
        {data.items.map((item, index) => {
          const Icon = ICONS[item.icon];

          return (
            <li key={`${item.title}-${index}`} className={cn("flex gap-3", strip ? "items-start" : "flex-col")}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--stone)]">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <strong className="block font-semibold">{item.title}</strong>
                {item.text && (
                  // The strip shows titles only on phones, to stay short
                  <span className={cn("text-muted-foreground", strip && "hidden sm:block")}>{item.text}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

export default FeaturesSection;
