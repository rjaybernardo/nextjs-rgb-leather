import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/auth-guard";
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

  const [order, admin] = await Promise.all([getOrderById(id), isAdmin()]);

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
    />
  );
};

export default OrderDetailsPage;
