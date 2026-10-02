"use client";

import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toast } from "@/components/ui/toast";
import { addItemToCart } from "@/lib/actions/cart.actions";
import type { Product } from "@/types";

import { pillButton } from "./section-shell";

const SpotlightAddButton = ({ product, label }: { product: Product; label: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function addToBag() {
    startTransition(async () => {
      const result = await addItemToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? "",
        price: product.price,
        qty: 1,
      });

      if (!result.success) {
        toast.add({ type: "error", description: result.message });
        return;
      }

      setAdded(true);
      router.refresh();
      window.setTimeout(() => setAdded(false), 2500);
    });
  }

  return (
    <button type="button" onClick={addToBag} disabled={isPending} className={pillButton.dark}>
      {isPending && <Loader className="size-4 animate-spin" aria-hidden="true" />}
      {added ? "Added to bag" : label}
    </button>
  );
};

export default SpotlightAddButton;
