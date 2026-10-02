import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyAddresses } from "@/lib/actions/address.actions";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import type { ShippingAddress } from "@/types";

import ShippingAddressPicker from "./shipping-address-picker";

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
    redirect("/sign-in?callbackUrl=/shipping-address");
  }

  const [user, addresses] = await Promise.all([
    getUserById(userId),
    getMyAddresses(),
  ]);

  // Preselect the address last used at checkout, if it's still saved
  const current = user.address as ShippingAddress | null;

  const selectedId = current
    ? addresses.find(
        (address) =>
          address.fullName === current.fullName &&
          address.streetAddress === current.streetAddress &&
          address.postalCode === current.postalCode,
      )?.id
    : undefined;

  return <ShippingAddressPicker addresses={addresses} selectedId={selectedId} />;
};

export default ShippingAddressPage;
