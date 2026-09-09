import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth-guard";
import { deleteOrder, getAllOrders } from "@/lib/actions/order.actions";
import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Orders",
};

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requireAdmin();

  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  const orders = await getAllOrders({
    page: currentPage,
  });

  return (
    <div className="space-y-4">
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
            {orders.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatId(order.id)}</TableCell>

                  <TableCell>
                    {formatDateTime(order.createdAt).dateTime}
                  </TableCell>

                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>

                  <TableCell>
                    {order.isPaid && order.paidAt
                      ? formatDateTime(order.paidAt).dateTime
                      : "Not Paid"}
                  </TableCell>

                  <TableCell>
                    {order.isDelivered && order.deliveredAt
                      ? formatDateTime(order.deliveredAt).dateTime
                      : "Not Delivered"}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1">
                      <Link
                        href={`/order/${order.id}`}
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "sm",
                          }),
                        )}
                      >
                        Details
                      </Link>

                      <DeleteDialog id={order.id} action={deleteOrder} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {orders.totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={currentPage} totalPages={orders.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}
