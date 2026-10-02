import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { isAdmin } from "@/lib/auth-guard";
import type { ShippingAddress } from "@/types";

import OrderDetailsTable from "./order-details-table";

export const metadata: Metadata = {
  title: "Order Details",
};

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    payment?: string;
  }>;
};

const OrderDetailsPage = async ({
  params,
  searchParams,
}: OrderDetailsPageProps) => {
  const [{ id }, { payment }] = await Promise.all([params, searchParams]);

  const [order, admin, session] = await Promise.all([
    getOrderById(id),
    isAdmin(),
    auth(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      isAdmin={admin}
      isOwner={order.userId === session?.user?.id}
      paymentReturn={
        payment === "success" || payment === "cancelled" ? payment : undefined
      }
    />
  );
};

export default OrderDetailsPage;
