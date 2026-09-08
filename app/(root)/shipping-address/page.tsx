import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ShippingAddressForm from "./shipping-address-form";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import type { ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Shipping Address",
};

const ShippingAddressPage = async () => {
  const cart = await getMyCart();

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User ID not found");
  }

  const user = await getUserById(userId);

  return <ShippingAddressForm address={user.address as ShippingAddress} />;
};

export default ShippingAddressPage;
