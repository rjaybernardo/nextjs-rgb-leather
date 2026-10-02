import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Plain GET form: works without JavaScript and keeps the URL shareable
const SearchBox = ({ className }: { className?: string }) => {
  return (
    <form
      action="/search"
      method="GET"
      role="search"
      className={cn("flex w-full items-center gap-1", className)}
    >
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>

      <Input
        id="header-search"
        name="q"
        type="search"
        placeholder="Search bags, wallets, belts..."
        className="w-full"
      />

      <Button type="submit" variant="ghost" size="icon" aria-label="Search">
        <Search />
      </Button>
    </form>
  );
};

export default SearchBox;
