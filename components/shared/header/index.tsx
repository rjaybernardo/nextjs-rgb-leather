import Link from "next/link";

import SiteLogo from "@/components/shared/site-logo";
import { getSiteSettings } from "@/lib/site";

import AnnouncementBar from "./announcement-bar";
import CategoryMenu from "./category-menu";
import Menu from "./menu";
import SearchBox from "./search-box";

const Header = async () => {
  const { siteName } = await getSiteSettings();

  return (
    <>
      <AnnouncementBar />

      <header className="w-full border-b">
        <div className="wrapper flex-between gap-4">
          <div className="flex-start gap-2">
            <Link href="/" className="flex-start">
              <SiteLogo size={48} priority />

              <span className="ml-3 hidden text-2xl font-bold lg:block">
                {siteName}
              </span>
            </Link>

            <div className="hidden md:block">
              <CategoryMenu />
            </div>
          </div>

          <SearchBox className="hidden max-w-md md:flex" />

          <Menu />
        </div>
      </header>
    </>
  );
};

export default Header;
