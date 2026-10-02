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
    <Section tone={strip ? "stone" : "paper"} innerClassName={cn(strip && "py-7")}>
      {data.title && <SectionTitle text={data.title} className="mb-10" />}

      <ul
        className={cn(
          "grid grid-cols-2 gap-6 text-sm lg:grid-cols-4",
          !strip && "rounded-md border bg-card p-6 md:p-8",
        )}
      >
        {data.items.map((item, index) => {
          const Icon = ICONS[item.icon];

          return (
            <li key={`${item.title}-${index}`} className={cn("flex gap-3.5", strip ? "items-center" : "flex-col")}>
              <Icon className="size-[26px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <strong className="block font-semibold">{item.title}</strong>
                {item.text && <span className="text-muted-foreground">{item.text}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

export default FeaturesSection;
