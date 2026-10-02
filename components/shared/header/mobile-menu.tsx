"use client";

import { Menu as MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import ModeToggle from "./mode-toggle";
import SearchBox from "./search-box";

type NavLink = { href: string; label: string };

// Phone and tablet navigation
export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <MenuIcon className="size-[22px]" strokeWidth={1.7} />
      </SheetTrigger>

      <SheetContent side="left" className="storefront flex flex-col gap-6 p-6">
        <SheetTitle>Menu</SheetTitle>
        <SheetDescription className="sr-only">Shop by category and search</SheetDescription>

        <SearchBox />

        <nav aria-label="Main" className="flex flex-col gap-1 text-lg font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
          Appearance
          <ModeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
