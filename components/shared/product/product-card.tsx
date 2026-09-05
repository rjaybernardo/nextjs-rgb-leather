import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="p-0">
        <Link href={`/product/${product.slug}`} className="block">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={300}
            height={300}
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
            <p className="font-bold">${product.price.toFixed(2)}</p>
          ) : (
            <p className="font-bold text-destructive">Out of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
