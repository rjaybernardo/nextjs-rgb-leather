import DealCountdown from "@/components/deal-countdown";
import IconBoxes from "@/components/icon-boxes";
import FeaturedCarousel from "@/components/shared/product/featured-carousel";
import ProductList from "@/components/shared/product/product-list";
import { buttonVariants } from "@/components/ui/button";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/lib/actions/product.actions";
import Link from "next/link";

const HomePage = async () => {
  const [latestProducts, featuredProducts] = await Promise.all([
    getLatestProducts(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="space-y-8">
      <FeaturedCarousel products={featuredProducts} />

      <ProductList title="Newest Arrivals" data={latestProducts} />

      <div className="flex justify-center">
        <Link
          href="/search"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          View all products
        </Link>
      </div>

      <DealCountdown />

      <IconBoxes />
    </div>
  );
};

export default HomePage;
