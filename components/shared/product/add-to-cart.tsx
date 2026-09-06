"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";
import { addItemToCart } from "@/lib/actions/cart.actions";
import type { CartItem } from "@/types";

type AddToCartProps = {
  item: CartItem;
};

const AddToCart = ({ item }: AddToCartProps) => {
  const handleAddToCart = async () => {
    const res = await addItemToCart(item);

    if (!res.success) {
      toast.add({
        title: "Unable to add item",
        description: res.message,
        type: "error",
      });

      return;
    }

    toast.add({
      title: "Added to cart",
      description: `${item.name} added to the cart`,
      type: "success",
    });
  };

  return (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      <Plus />
      Add to cart
    </Button>
  );
};

export default AddToCart;
