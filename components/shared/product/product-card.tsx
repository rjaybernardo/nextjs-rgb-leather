import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductPrice from "@/components/shared/product/product-price";
import type { Product } from "@/types";

const ProductCard = ({ product }: { product: Product }) => {
  const image = product.images[0];

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="p-0">
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
        <div className="text-xs text-muted-foreground">{product.brand}</div>

        <Link href={`/product/${product.slug}`}>
          <h2 className="text-sm font-medium">{product.name}</h2>
        </Link>

        <div className="flex-between gap-4">
          <p>{product.rating} stars</p>

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
