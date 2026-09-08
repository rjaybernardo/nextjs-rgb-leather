import { getMyCart } from "@/lib/actions/cart.actions";
import AddToCart from "@/components/shared/product/add-to-cart";
import type { CartItem } from "@/types";

type CartButtonProps = {
  item: CartItem;
};

const CartButton = async ({ item }: CartButtonProps) => {
  const cart = await getMyCart();

  return <AddToCart cart={cart} item={item} />;
};

export default CartButton;
