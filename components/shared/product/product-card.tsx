"use client";

import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import Rating from "@/components/shared/product/rating";
import WishlistButton from "@/components/shared/product/wishlist-button";
import { toast } from "@/components/ui/toast";
import { addItemToCart } from "@/lib/actions/cart.actions";
import { isColorOption, swatchColor } from "@/lib/color-swatches";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { priceRange } from "@/lib/variant-utils";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  // Omit to hide the wishlist heart
  wishlisted?: boolean;
};

const NEW_FOR_DAYS = 30;

// Product card from the storefront design: photo on a warm backdrop, badge,
// rating, color swatches and Add to bag
const ProductCard = ({ product, wishlisted }: ProductCardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const colorOption = product.options?.find((option) => isColorOption(option.name));
  const otherOptions = (product.options ?? []).filter((option) => !isColorOption(option.name));

  // Colors that have a variant in stock come first
  const colors = useMemo(() => colorOption?.values ?? [], [colorOption]);
  const firstInStock = colors.find((color) =>
    product.variants.some((variant) => variant.options[colorOption!.name] === color && variant.stock > 0),
  );

  const [color, setColor] = useState(firstInStock ?? colors[0]);

  const colorVariant = colorOption
    ? product.variants.find((variant) => variant.options[colorOption.name] === color)
    : undefined;

  const image = colorVariant?.image || product.images[0];
  const range = priceRange(product.variants ?? []);
  const showFrom = range !== null && range.max > range.min && !colorVariant;
  const price = colorVariant?.price ?? product.price;

  const stock = colorVariant ? colorVariant.stock : product.stock;
  // Read once, so re-renders don't change the badge
  const [now] = useState(() => Date.now());
  const isNew = now - new Date(product.createdAt).getTime() < NEW_FOR_DAYS * 24 * 60 * 60 * 1000;

  const badge =
    stock <= 0
      ? "Sold out"
      : stock <= LOW_STOCK_THRESHOLD
        ? `Only ${stock} left`
        : isNew
          ? "New"
          : product.isFeatured
            ? "Featured"
            : null;

  // Sizes etc. are chosen on the product page
  const needsProductPage = otherOptions.length > 0;

  function addToBag() {
    startTransition(async () => {
      const result = await addItemToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: image ?? "",
        price,
        qty: 1,
        ...(colorVariant ? { variantId: colorVariant.id, variantTitle: colorVariant.title } : {}),
      });

      if (!result.success) {
        toast.add({ type: "error", description: result.message });
        return;
      }

      setAdded(true);
      router.refresh();
      window.setTimeout(() => setAdded(false), 2500);
    });
  }

  const href = `/product/${product.slug}`;

  return (
    <article className="flex min-w-0 flex-col gap-3.5">
      <div className="backdrop-leather relative aspect-[4/5]">
        <Link href={href} className="absolute inset-0 block" tabIndex={-1} aria-hidden="true">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No photo yet
            </span>
          )}
        </Link>

        {badge && (
          <span
            className={cn(
              "absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold",
              stock <= 0
                ? "bg-[var(--night)] text-[var(--on-night)]"
                : "bg-background text-foreground",
            )}
          >
            {badge}
          </span>
        )}

        {wishlisted !== undefined && (
          <WishlistButton
            productId={product.id}
            productName={product.name}
            initialWishlisted={wishlisted}
            className="absolute right-2 top-2 z-10"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <h3 className="min-w-0 text-[15px] font-semibold tracking-[-0.01em] sm:text-[17px]">
          <Link href={href} className="hover:text-[var(--brand)]">
            {product.name}
          </Link>
        </h3>

        <span className="shrink-0 font-semibold tabular-nums">
          {showFrom && <span className="mr-1 text-xs font-normal text-muted-foreground">From</span>}
          {formatCurrency(price)}
        </span>
      </div>

      <div className="-mt-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
        {product.numReviews > 0 ? (
          <>
            <Rating value={product.rating} size="sm" />
            <span>
              {product.numReviews} {product.numReviews === 1 ? "review" : "reviews"}
            </span>
          </>
        ) : (
          <span>{product.brand}</span>
        )}
      </div>

      {colorOption && colors.length > 0 && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-wrap gap-2" role="group" aria-label={`${colorOption.name} for ${product.name}`}>
            {colors.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                aria-label={value}
                aria-pressed={value === color}
                className={cn(
                  "size-[26px] rounded-full border-2 border-background shadow-[0_0_0_1px_var(--line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  value === color && "shadow-[0_0_0_2px_var(--foreground)]",
                )}
                style={{ backgroundColor: swatchColor(value) }}
              />
            ))}
          </div>
          <span className="text-[13px] text-muted-foreground">{color}</span>
        </div>
      )}

      {needsProductPage ? (
        <Link
          href={href}
          className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border-[1.5px] border-foreground text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
        >
          Choose options
        </Link>
      ) : (
        <button
          type="button"
          onClick={addToBag}
          disabled={isPending || stock <= 0}
          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-foreground text-sm font-semibold transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isPending && <Loader className="size-4 animate-spin" aria-hidden="true" />}
          {stock <= 0 ? "Sold out" : added ? "Added to bag" : "Add to bag"}
        </button>
      )}
    </article>
  );
};

export default ProductCard;
