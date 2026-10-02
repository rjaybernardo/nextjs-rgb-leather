import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import ProductPrice from "@/components/shared/product/product-price";
import { Card, CardContent } from "@/components/ui/card";
import { getProductBySlug } from "@/lib/actions/product.actions";
import ProductImages from "@/components/shared/product/product-images";
import CartButton from "@/components/shared/product/cart-button";
import Rating from "@/components/shared/product/rating";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

import ReviewList from "./review-list";

type ProductDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const ProductDetailsPage = async ({ params }: ProductDetailsPageProps) => {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Images Column */}
        <div className="md:col-span-2">
          <ProductImages images={product.images} />
        </div>

        {/* Details Column */}
        <div className="p-5 md:col-span-2">
          <div className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              {product.brand} {product.category}
            </p>

            <h1 className="h3-bold">{product.name}</h1>

            <a href="#reviews" className="flex items-center gap-2 text-sm">
              <Rating value={product.rating} />
              <span className="text-muted-foreground">
                {product.numReviews}{" "}
                {product.numReviews === 1 ? "review" : "reviews"}
              </span>
            </a>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ProductPrice
                value={product.price}
                className="w-fit rounded-full bg-green-100 px-5 py-2 text-green-700"
              />
            </div>
          </div>

          <div className="mt-10">
            <p className="font-semibold">Description:</p>
            <p className="mt-2 text-muted-foreground">{product.description}</p>
          </div>
        </div>

        {/* Action Column */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between">
                <div>Price</div>

                <div>
                  <ProductPrice value={product.price} />
                </div>
              </div>

              <div className="mb-2 flex justify-between">
                <div>Status</div>

                {product.stock <= 0 ? (
                  <Badge variant="destructive">Out of stock</Badge>
                ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                  <Badge variant="secondary">Only {product.stock} left</Badge>
                ) : (
                  <Badge variant="outline">In stock</Badge>
                )}
              </div>

              {product.stock > 0 && (
                <div className="flex">
                  <CartButton
                    stock={product.stock}
                    item={{
                      productId: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      qty: 1,
                      image: product.images[0],
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <ReviewList productId={product.id} productSlug={product.slug} />
      </div>
    </section>
  );
};

export default ProductDetailsPage;
