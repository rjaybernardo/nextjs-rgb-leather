import { getAllCategories, getAllProducts, getLatestProducts } from "@/lib/actions/product.actions";
import { getMyWishlistIds } from "@/lib/actions/wishlist.actions";
import type { SectionData } from "@/lib/site-config";

import ProductTabs from "./product-tabs";
import { Section, SectionTitle } from "./section-shell";

const MAX_TABS = 5;

// Product grid with one tab per category (the design's "What do you carry?")
const ProductTabsSection = async ({ data }: { data: SectionData<"product_tabs"> }) => {
  const [categories, wishlistIds] = await Promise.all([getAllCategories(), getMyWishlistIds()]);

  const categoryTabs = await Promise.all(
    categories.slice(0, MAX_TABS).map(async (category) => {
      const { data: products } = await getAllProducts({
        query: "all",
        category: category.slug,
        page: 1,
        limit: data.count,
      });

      return {
        label: category.name,
        href: `/search?${new URLSearchParams({ category: category.slug })}`,
        products,
      };
    }),
  );

  const tabs =
    data.showAllTab === "yes" || categoryTabs.length === 0
      ? [{ label: "All", href: "/search", products: await getLatestProducts(data.count) }, ...categoryTabs]
      : categoryTabs;

  if (tabs.every((tab) => tab.products.length === 0)) return null;

  return (
    <Section id="shop" aria-labelledby="shop-title">
      <ProductTabs
        title={<SectionTitle id="shop-title" text={data.title} />}
        tabs={tabs}
        wishlistIds={wishlistIds}
      />
    </Section>
  );
};

export default ProductTabsSection;
