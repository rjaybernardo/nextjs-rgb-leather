import {
  Award,
  BadgeCheck,
  Gift,
  Hammer,
  Headset,
  Leaf,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { FEATURE_ICONS, SectionData } from "@/lib/site-config";

const ICONS: Record<(typeof FEATURE_ICONS)[number], LucideIcon> = {
  ShoppingBag,
  Truck,
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
  return (
    <section className="space-y-4">
      {data.title && <h2 className="h2-bold">{data.title}</h2>}

      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 md:grid-cols-4">
          {data.items.map((item, index) => {
            const Icon = ICONS[item.icon];

            return (
              <div key={`${item.title}-${index}`} className="space-y-2">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <div className="text-sm font-bold">{item.title}</div>
                {item.text && <div className="text-sm text-muted-foreground">{item.text}</div>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
};

export default FeaturesSection;
