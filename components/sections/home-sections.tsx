import DealCountdown from "@/components/deal-countdown";
import { stripAccents } from "@/components/shared/accent-text";
import FeaturedCarousel from "@/components/shared/product/featured-carousel";
import ProductCard from "@/components/shared/product/product-card";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/lib/actions/product.actions";
import { getMyWishlistIds } from "@/lib/actions/wishlist.actions";
import type { HomeSectionView } from "@/lib/site";
import type { SectionData } from "@/lib/site-config";
import type { Product } from "@/types";

import { Carousel } from "./carousel";
import CategoryGridSection from "./category-grid-section";
import CraftSection from "./craft-section";
import FaqSection from "./faq-section";
import FeaturesSection from "./features-section";
import GallerySection from "./gallery-section";
import HeroSection from "./hero-section";
import NewsletterSection from "./newsletter-section";
import ProductTabsSection from "./product-tabs-section";
import { Section, SectionHeader, SectionTitle } from "./section-shell";
import SpotlightSection from "./spotlight-section";
import StepsSection from "./steps-section";
import StorySection from "./story-section";
import TestimonialsSection from "./testimonials-section";

const FeaturedCarouselSection = async ({ title }: { title: string }) => {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <Section innerClassName="flex flex-col gap-10">
      {title && <SectionTitle text={title} />}
      <FeaturedCarousel products={products} />
    </Section>
  );
};

const NewestProductsSection = async ({ data }: { data: SectionData<"newest_products"> }) => {
  const products = await getLatestProducts(data.count);

  if (products.length === 0) return null;

  return (
    <Section innerClassName="flex flex-col gap-8">
      <SectionHeader title={data.title} linkText="View all" linkUrl="/search" />

      {/* In grid layout, products still swipe on phones (one centred, a
          neighbour peeking on each side) */}
      <NewestProductsCarousel
        title={stripAccents(data.title)}
        products={products}
        phoneOnly={data.layout === "grid"}
      />
    </Section>
  );
};

const NewestProductsCarousel = async ({
  title,
  products,
  phoneOnly,
}: {
  title: string;
  products: Product[];
  phoneOnly: boolean;
}) => {
  const wishlistIds = new Set(await getMyWishlistIds());

  return (
    <Carousel label={title} columns="products" phoneOnly={phoneOnly}>
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} wishlisted={wishlistIds.has(product.id)} />
      ))}
    </Carousel>
  );
};

// Renders one home section from Site Studio by its type
const HomeSection = ({ section, isFirst }: { section: HomeSectionView; isFirst: boolean }) => {
  switch (section.type) {
    case "hero":
      return <HeroSection data={section.data} priority={isFirst} />;
    case "featured_carousel":
      return <FeaturedCarouselSection title={section.data.title} />;
    case "newest_products":
      return <NewestProductsSection data={section.data} />;
    case "category_grid":
      return <CategoryGridSection data={section.data} />;
    case "deal":
      return <DealCountdown {...section.data} />;
    case "features":
      return <FeaturesSection data={section.data} />;
    case "story":
      return <StorySection data={section.data} />;
    case "testimonials":
      return <TestimonialsSection data={section.data} />;
    case "faq":
      return <FaqSection data={section.data} />;
    case "newsletter":
      return <NewsletterSection data={section.data} />;
    case "product_tabs":
      return <ProductTabsSection data={section.data} />;
    case "craft":
      return <CraftSection data={section.data} />;
    case "spotlight":
      return <SpotlightSection data={section.data} />;
    case "steps":
      return <StepsSection data={section.data} />;
    case "gallery":
      return <GallerySection data={section.data} />;
  }
};

const HomeSections = ({ sections }: { sections: HomeSectionView[] }) => (
  // Sections are full-width bands; replace the page wrapper's padding with
  // the section spacing, so the last section is as far from the footer as
  // sections are from each other
  <div className="-mt-5 -mb-5 pb-[var(--section-y)]">
    {sections.map((section, index) => (
      <HomeSection key={section.id} section={section} isFirst={index === 0} />
    ))}
  </div>
);

export default HomeSections;
