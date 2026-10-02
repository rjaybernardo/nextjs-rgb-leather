import DealCountdown from "@/components/deal-countdown";
import FeaturedCarousel from "@/components/shared/product/featured-carousel";
import ProductList from "@/components/shared/product/product-list";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/lib/actions/product.actions";
import type { HomeSectionView } from "@/lib/site";

import CategoryGridSection from "./category-grid-section";
import FaqSection from "./faq-section";
import FeaturesSection from "./features-section";
import HeroSection from "./hero-section";
import NewsletterSection from "./newsletter-section";
import StorySection from "./story-section";
import TestimonialsSection from "./testimonials-section";

const FeaturedCarouselSection = async ({ title }: { title: string }) => {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      {title && <h2 className="h2-bold">{title}</h2>}
      <FeaturedCarousel products={products} />
    </section>
  );
};

const NewestProductsSection = async ({ title, count }: { title: string; count: number }) => {
  const products = await getLatestProducts(count);

  return <ProductList title={title} data={products} />;
};

// Renders one home section from Site Studio by its type
const HomeSection = ({ section, isFirst }: { section: HomeSectionView; isFirst: boolean }) => {
  switch (section.type) {
    case "hero":
      return <HeroSection data={section.data} priority={isFirst} />;
    case "featured_carousel":
      return <FeaturedCarouselSection title={section.data.title} />;
    case "newest_products":
      return <NewestProductsSection title={section.data.title} count={section.data.count} />;
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
  }
};

const HomeSections = ({ sections }: { sections: HomeSectionView[] }) => (
  <div className="space-y-12 py-6">
    {sections.map((section, index) => (
      <HomeSection key={section.id} section={section} isFirst={index === 0} />
    ))}
  </div>
);

export default HomeSections;
