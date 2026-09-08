"use client";

import { useTransition } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import type { Cart, CartItem } from "@/types";

type AddToCartProps = {
  cart?: Cart;
  item: Omit<CartItem, "cartId">;
};

const AddToCart = ({ cart, item }: AddToCartProps) => {
  const [isPending, startTransition] = useTransition();

  const existItem = cart?.items.find(
    (cartItem) => cartItem.productId === item.productId,
  );

  const handleAddToCart = () => {
    startTransition(async () => {
      const res = await addItemToCart(item);

      toast.add({
        title: res.success ? "Added to cart" : "Unable to add item",
        description: res.message,
        type: res.success ? "success" : "error",
      });
    });
  };

  const handleRemoveFromCart = () => {
    startTransition(async () => {
      const res = await removeItemFromCart(item.productId);

      toast.add({
        title: res.success ? "Cart updated" : "Unable to update cart",
        description: res.message,
        type: res.success ? "success" : "error",
      });
    });
  };

  if (existItem) {
    return (
      <div className="flex w-full items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRemoveFromCart}
          disabled={isPending}
          aria-label={`Decrease quantity of ${item.name}`}
        >
          <Minus />
        </Button>

        <span className="min-w-8 text-center font-medium" aria-live="polite">
          {existItem.qty}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddToCart}
          disabled={isPending}
          aria-label={`Increase quantity of ${item.name}`}
        >
          <Plus />
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="w-full"
      type="button"
      onClick={handleAddToCart}
      disabled={isPending}
    >
      <Plus />
      Add to cart
    </Button>
  );
};

export default AddToCart;
