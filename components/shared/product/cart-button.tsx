import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.actions";
import type { CartItem } from "@/types";

type CartButtonProps = {
  item: Omit<CartItem, "cartId">;
  stock: number;
};

const CartButton = async ({ item, stock }: CartButtonProps) => {
  const cart = await getMyCart();

  return <AddToCart cart={cart} item={item} stock={stock} />;
};

export default CartButton;
