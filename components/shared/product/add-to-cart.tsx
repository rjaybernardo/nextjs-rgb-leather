"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import type { Cart, CartItem } from "@/types";

type AddToCartProps = {
  cart?: Cart;
  item: CartItem;
};

const AddToCart = ({ cart, item }: AddToCartProps) => {
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

  const handleRemoveFromCart = async () => {
    const res = await removeItemFromCart(item.productId);

    if (!res.success) {
      toast.add({
        title: "Unable to remove item",
        description: res.message,
        type: "error",
      });

      return;
    }

    toast.add({
      title: "Cart updated",
      description: res.message,
      type: "success",
    });
  };

  const existItem = cart?.items.find(
    (cartItem) => cartItem.productId === item.productId,
  );

  return existItem ? (
    <div className="flex items-center">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleRemoveFromCart}
        aria-label={`Remove one ${item.name} from cart`}
      >
        <Minus />
      </Button>

      <span className="min-w-10 px-2 text-center">{existItem.qty}</span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleAddToCart}
        aria-label={`Add one more ${item.name} to cart`}
      >
        <Plus />
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      <Plus />
      Add to cart
    </Button>
  );
};

export default AddToCart;
