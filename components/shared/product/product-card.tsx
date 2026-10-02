import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductPrice from "@/components/shared/product/product-price";
import Rating from "@/components/shared/product/rating";
import { Badge } from "@/components/ui/badge";
import WishlistButton from "@/components/shared/product/wishlist-button";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
  // Omit to hide the wishlist heart
  wishlisted?: boolean;
};

const ProductCard = ({ product, wishlisted }: ProductCardProps) => {
  const image = product.images[0];

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="relative p-0">
        {wishlisted !== undefined && (
          <WishlistButton
            productId={product.id}
            productName={product.name}
            initialWishlisted={wishlisted}
            className="absolute right-2 top-2 z-10"
          />
        )}

        <Link href={`/product/${product.slug}`} className="block">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              width={300}
              height={300}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center bg-muted text-sm text-muted-foreground"
              aria-label="No product image"
            >
              No image
            </div>
          )}
        </Link>
      </CardHeader>

      <CardContent className="grid gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">{product.brand}</div>

          {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && (
            <Badge variant="secondary">Only {product.stock} left</Badge>
          )}
        </div>

        <Link href={`/product/${product.slug}`}>
          <h2 className="text-sm font-medium">{product.name}</h2>
        </Link>

        <div className="flex-between gap-4">
          <div className="flex items-center gap-1">
            <Rating value={product.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              ({product.numReviews})
            </span>
          </div>

          {product.stock > 0 ? (
            <ProductPrice value={product.price} />
          ) : (
            <p className="font-bold text-destructive">Out of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
