"use client";

import Link from "next/link";
import { useState } from "react";

import ProductCard from "@/components/shared/product/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type Tab = { label: string; href: string; products: Product[] };

const ProductTabs = ({
  title,
  tabs,
  wishlistIds,
}: {
  title: React.ReactNode;
  tabs: Tab[];
  wishlistIds: string[];
}) => {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const saved = new Set(wishlistIds);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        {title}

        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show products in">
            {tabs.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={index === active}
                className={cn(
                  "min-h-11 rounded-full border-[1.5px] px-5 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
                  index === active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
          {tab.products.map((product) => (
            <ProductCard key={product.id} product={product} wishlisted={saved.has(product.id)} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nothing here yet.</p>
      )}

      <div>
        <Link href={tab.href} className="text-[15px] font-semibold underline underline-offset-4 hover:text-[var(--brand-ink)]">
          Shop all {tab.label === "All" ? "products" : tab.label}
        </Link>
      </div>
    </div>
  );
};

export default ProductTabs;
