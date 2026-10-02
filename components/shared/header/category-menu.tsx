import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { getAllCategories } from "@/lib/actions/product.actions";

const CategoryMenu = async () => {
  // Request-time only: the menu reflects current categories, and builds
  // don't need a database connection
  await connection();

  const categories = await getAllCategories();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={buttonVariants({ variant: "ghost" })}
          />
        }
      >
        Shop
        <ChevronDown aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/search" className="w-full" />}>
            All products
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {categories.length > 0 && <DropdownMenuSeparator />}

        <DropdownMenuGroup>
          {categories.map(({ name, slug }) => (
            <DropdownMenuItem
              key={slug}
              render={
                <Link
                  href={`/search?${new URLSearchParams({ category: slug })}`}
                  className="w-full"
                />
              }
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryMenu;
