import Link from "next/link";

import HomeSections from "@/components/sections/home-sections";
import { buttonVariants } from "@/components/ui/button";
import { getHomeSections } from "@/lib/site";

// Sections, their order and content come from Site Studio → Home page
const HomePage = async () => {
  const sections = await getHomeSections();

  if (sections.length === 0) {
    return (
      <div className="py-20 text-center">
        <Link href="/search" className={buttonVariants({ size: "lg" })}>
          Browse all products
        </Link>
      </div>
    );
  }

  return <HomeSections sections={sections} />;
};

export default HomePage;
