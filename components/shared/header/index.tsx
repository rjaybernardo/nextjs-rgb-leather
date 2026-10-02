import { Search } from "lucide-react";
import Link from "next/link";

import { getAllCategories } from "@/lib/actions/product.actions";

import AnnouncementBar from "./announcement-bar";
import BagButton from "./bag-button";
import MobileMenu from "./mobile-menu";
import ModeToggle from "./mode-toggle";
import UserButton from "./user-button";
import Wordmark from "./wordmark";

const iconClass =
  "inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Storefront header: announcement, wordmark, category links and icon actions
const Header = async () => {
  const categories = await getAllCategories();

  const links = [
    { href: "/search", label: "Shop all" },
    ...categories.slice(0, 4).map((category) => ({
      href: `/search?${new URLSearchParams({ category: category.slug })}`,
      label: category.name,
    })),
  ];

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="wrap flex min-h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-2 lg:gap-10">
            <MobileMenu links={links} />

            <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-ring">
              <Wordmark />
            </Link>

            <nav aria-label="Main" className="hidden items-center gap-8 text-[15px] font-medium lg:flex">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--brand)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <Link href="/search" className={iconClass} aria-label="Search">
              <Search className="size-5" strokeWidth={1.7} />
            </Link>

            <div className="hidden sm:block">
              <ModeToggle />
            </div>

            <UserButton variant="icon" />

            <BagButton />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
