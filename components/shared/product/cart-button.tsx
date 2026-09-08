import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.actions";
import type { CartItem } from "@/types";

type CartButtonProps = {
  item: Omit<CartItem, "cartId">;
};

const CartButton = async ({ item }: CartButtonProps) => {
  const cart = await getMyCart();

  return <AddToCart cart={cart} item={item} />;
};

export default CartButton;
