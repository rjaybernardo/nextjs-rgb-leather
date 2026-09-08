import type { Metadata } from "next";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyOrders } from "@/lib/actions/order.actions";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Orders",
};

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const OrdersPage = async ({ searchParams }: OrdersPageProps) => {
  const { page } = await searchParams;

  const orders = await getMyOrders({
    page: Number(page) || 1,
  });

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight">Orders</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>DELIVERED</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.data.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{formatId(order.id)}</TableCell>

                <TableCell>
                  {formatDateTime(order.createdAt).dateTime}
                </TableCell>

                <TableCell>
                  {formatCurrency(Number(order.totalPrice))}
                </TableCell>

                <TableCell>
                  {order.isPaid && order.paidAt
                    ? formatDateTime(order.paidAt).dateTime
                    : "Not paid"}
                </TableCell>

                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatDateTime(order.deliveredAt).dateTime
                    : "Not delivered"}
                </TableCell>

                <TableCell>
                  <Link
                    href={`/order/${order.id}`}
                    className="text-primary hover:underline"
                  >
                    Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersPage;
