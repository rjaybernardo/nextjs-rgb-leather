import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductPrice from "@/components/shared/product/product-price";
import type { Product } from "@/types";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="p-0">
        <Link href={`/product/${product.slug}`} className="block">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={300}
            height={300}
            loading="eager"
            className="aspect-square w-full object-cover"
          />
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
