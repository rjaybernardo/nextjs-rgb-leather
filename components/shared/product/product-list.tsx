import { getMyWishlistIds } from "@/lib/actions/wishlist.actions";

import ProductCard from "./product-card";

import type { Product } from "@/types";

const ProductList = async ({
  data,
  title,
  limit,
}: {
  data: Product[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit !== undefined ? data.slice(0, limit) : data;

  const wishlistIds = new Set(await getMyWishlistIds());

  return (
    <section className={title ? "my-10" : undefined}>
      {title && <h2 className="h-section mb-8 text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h2>}

      {limitedData.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
          {limitedData.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              wishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      ) : (
        <div>
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </section>
  );
};

export default ProductList;
