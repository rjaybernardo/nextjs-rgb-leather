import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { getMyCart } from "@/lib/actions/cart.actions";

const BagButton = async () => {
  const cart = await getMyCart();
  const count = cart?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ShoppingBag className="size-5" strokeWidth={1.7} />

      {count > 0 && (
        <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-bold text-[var(--brand-foreground)]">
          {count}
        </span>
      )}
    </Link>
  );
};

export default BagButton;
