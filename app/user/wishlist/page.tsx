import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/shared/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import { getMyWishlist } from "@/lib/actions/wishlist.actions";

export const metadata: Metadata = {
  title: "My Wishlist",
};

export default async function WishlistPage() {
  const products = await getMyWishlist();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Wishlist</h2>

      {products.length === 0 ? (
        <div className="space-y-4 rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Tap the heart on any product to save it here.
          </p>

          <Link href="/search" className={buttonVariants()}>
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
