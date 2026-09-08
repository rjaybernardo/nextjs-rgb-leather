"use client";

import type { Cart } from "@/types";

const CartTable = ({ cart }: { cart?: Cart }) => {
  return (
    <>
      <h1 className="h2-bold py-4">Shopping Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div>Cart is empty.</div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3"></div>
        </div>
      )}
    </>
  );
};

export default CartTable;
