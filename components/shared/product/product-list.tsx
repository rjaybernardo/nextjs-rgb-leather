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
    <section className="my-10">
      {title && <h2 className="h2-bold mb-4">{title}</h2>}

      {limitedData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          <p>No products found</p>
        </div>
      )}
    </section>
  );
};

export default ProductList;
