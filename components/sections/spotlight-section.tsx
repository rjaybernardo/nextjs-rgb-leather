import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getProductBySlug } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";

import { LeatherShape } from "./leather-shape";
import { Section, SectionTitle, pillButton } from "./section-shell";
import SpotlightAddButton from "./spotlight-add-button";

// One product or set, with its price and why it's worth it
const SpotlightSection = async ({ data }: { data: SectionData<"spotlight"> }) => {
  const product = data.productSlug ? await getProductBySlug(data.productSlug) : null;

  const image = data.imageUrl || product?.images[0] || "";
  const compareAt = Number(data.compareAtPrice);
  const showCompare = product && compareAt > Number(product.price);
  const canAddHere = product && product.variants.length === 0 && product.stock > 0;

  return (
    <Section tone="stone">
      <div className="grid items-center gap-[clamp(32px,5vw,80px)] lg:grid-cols-2">
        <div className="backdrop-leather flex aspect-[5/4] min-w-0 items-center justify-center gap-[6%] px-[8%]">
          {image ? (
            <Image src={image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <>
              <LeatherShape shape="card" tone="oxblood" className="h-[40%] w-[36%]" />
              <LeatherShape shape="card" tone="oxblood" className="h-[28%] w-[26%]" />
              <LeatherShape shape="strap" tone="oxblood" className="h-[34%] w-[10%]" />
            </>
          )}

          {data.badge && (
            <span className="absolute left-4 top-4 z-[2] rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
              {data.badge}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionTitle text={data.title} />
          {data.text && <p className="max-w-[44ch] text-lg text-muted-foreground">{data.text}</p>}

          {data.bullets.length > 0 && (
            <ul className="flex flex-col gap-2.5 text-[15px]">
              {data.bullets.map((bullet, index) => (
                <li key={`${bullet.text}-${index}`} className="flex items-center gap-3">
                  <Check className="size-[18px] shrink-0" aria-hidden="true" />
                  {bullet.text}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-5 pt-2">
            {product && (
              <div className="flex items-baseline gap-2.5 tabular-nums">
                <span className="text-[34px] font-bold tracking-[-0.03em]">{formatCurrency(product.price)}</span>
                {showCompare && (
                  <span className="text-[17px] text-muted-foreground line-through">
                    <span className="sr-only">Was </span>
                    {formatCurrency(compareAt)}
                  </span>
                )}
              </div>
            )}

            {canAddHere ? (
              <SpotlightAddButton product={product} label={data.ctaText || "Add to bag"} />
            ) : product ? (
              <Link href={`/product/${product.slug}`} className={pillButton.dark}>
                {data.ctaText || "View it"}
              </Link>
            ) : (
              data.ctaText &&
              data.ctaUrl && (
                <Link href={data.ctaUrl} className={pillButton.dark}>
                  {data.ctaText}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default SpotlightSection;
