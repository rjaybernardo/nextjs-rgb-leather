import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import type { ShippingAddress } from "@/types";

import OrderDetailsTable from "./order-details-table";

export const metadata: Metadata = {
  title: "Order Details",
};

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const OrderDetailsPage = async ({ params }: OrderDetailsPageProps) => {
  const { id } = await params;

  const [order, session] = await Promise.all([getOrderById(id), auth()]);

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      isAdmin={session?.user?.role === "admin"}
    />
  );
};

export default OrderDetailsPage;
