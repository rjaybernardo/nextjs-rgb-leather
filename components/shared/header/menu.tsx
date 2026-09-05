import { EllipsisVertical, ShoppingCart, UserIcon } from "lucide-react";
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

const Menu = () => {
  return (
    <div className="flex items-center justify-end gap-2">
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

        <Link href="/sign-in" className={buttonVariants()}>
          <UserIcon />
          <span>Sign In</span>
        </Link>
      </nav>

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

              <Link
                href="/sign-in"
                className={buttonVariants({
                  className: "w-full justify-start",
                })}
              >
                <UserIcon />
                <span>Sign In</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
