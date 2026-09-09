import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeDollarSign, Barcode, CreditCard, Users } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrderSummary } from "@/lib/actions/order.actions";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  const session = await auth();

  // Allow only administrators to access the dashboard.
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const summary = await getOrderSummary();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Dashboard statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>

            <BadgeDollarSign className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>

            <CreditCard className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.ordersCount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>

            <Users className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.usersCount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>

            <Barcode className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.productsCount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Overview chart placeholder */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>

          <CardContent className="pl-2">
            <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
              Chart will be added in the next lesson.
            </div>
          </CardContent>
        </Card>

        {/* Recent sales */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>

          <CardContent>
            {summary.latestOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BUYER</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>TOTAL</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {summary.latestOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.user?.name || "Deleted user"}
                        </TableCell>

                        <TableCell>
                          {formatDateTime(order.createdAt).dateOnly}
                        </TableCell>

                        <TableCell>
                          {formatCurrency(Number(order.totalPrice))}
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/order/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
