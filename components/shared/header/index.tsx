import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, UserIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import ModeToggle from "./mode-toggle";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between">
        <div className="flex-start">
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
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
