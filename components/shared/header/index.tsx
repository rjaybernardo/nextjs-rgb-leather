import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

import CategoryMenu from "./category-menu";
import Menu from "./menu";
import SearchBox from "./search-box";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between gap-4">
        <div className="flex-start gap-2">
          <Link href="/" className="flex-start">
            <Image
              src="/images/logo.svg"
              alt={`${APP_NAME} logo`}
              width={48}
              height={48}
              priority
            />

            <span className="ml-3 hidden text-2xl font-bold lg:block">
              {APP_NAME}
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
  );
};

export default Header;
