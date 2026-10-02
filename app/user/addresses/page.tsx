import type { Metadata } from "next";

import { getMyAddresses } from "@/lib/actions/address.actions";

import AddressBook from "./address-book";

export const metadata: Metadata = {
  title: "My Addresses",
};

export default async function AddressesPage() {
  const addresses = await getMyAddresses();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Addresses</h2>

      <AddressBook addresses={addresses} />
    </div>
  );
}
