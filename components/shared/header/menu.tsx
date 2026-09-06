import { EllipsisVertical, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import ModeToggle from "./mode-toggle";
import UserButton from "./user-button";

const Menu = () => {
  return (
    <div className="flex items-center justify-end gap-2">
      {/* Desktop menu */}
      <nav className="hidden items-center gap-1 md:flex">
        <ModeToggle />

        <Link
          href="/cart"
          className={buttonVariants({
            variant: "ghost",
          })}
        >
          <ShoppingCart />
          <span>Cart</span>
        </Link>

        <UserButton />
      </nav>

      {/* Mobile menu */}
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                aria-label="Open menu"
              />
            }
          >
            <EllipsisVertical aria-hidden="true" />
          </SheetTrigger>

          <SheetContent side="right" className="flex flex-col items-start">
            <SheetTitle>Menu</SheetTitle>

            <SheetDescription>Navigation menu</SheetDescription>

            <div className="mt-4 flex w-full flex-col gap-2">
              <ModeToggle />

              <Link
                href="/cart"
                className={buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start",
                })}
              >
                <ShoppingCart />
                <span>Cart</span>
              </Link>

              <UserButton />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
