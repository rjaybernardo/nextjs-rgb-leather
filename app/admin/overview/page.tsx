import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDollarSign, CreditCard, ReceiptText, Users } from "lucide-react";

import Charts from "./charts";

import { requireAdmin } from "@/lib/auth-guard";
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
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  const summary = await getOrderSummary();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Dashboard statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>

            <BadgeDollarSign className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid orders, VAT included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid orders</CardTitle>

            <CreditCard className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.paidOrdersCount)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(summary.ordersCount)} orders placed
            </p>
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
            <CardTitle className="text-sm font-medium">Average order</CardTitle>

            <ReceiptText className="size-5" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(summary.productsCount)} products in the shop
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Overview chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue, last 12 months</CardTitle>
          </CardHeader>

          <CardContent className="pl-2">
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>

          <CardContent>
            {summary.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid orders yet.</p>
            ) : (
              <ol className="space-y-3">
                {summary.topProducts.map((product) => (
                  <li key={product.productId} className="flex items-baseline gap-3 text-sm">
                    <Link
                      href={`/admin/products/${product.productId}`}
                      className="flex-1 truncate hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="text-muted-foreground tabular-nums">
                      {formatNumber(product.qty)} sold
                    </span>
                    <span className="w-24 text-right font-medium tabular-nums">
                      {formatCurrency(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
          </CardHeader>

          <CardContent>
            {summary.categorySales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid orders yet.</p>
            ) : (
              <ul className="space-y-3">
                {summary.categorySales.map((entry) => (
                  <li key={entry.category} className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{entry.category}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(entry.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.max(
                            2,
                            (entry.revenue / summary.categorySales[0].revenue) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>

          <CardContent>
            {summary.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every product has more than {LOW_STOCK_THRESHOLD} in stock.
              </p>
            ) : (
              <ul className="space-y-2">
                {summary.lowStock.map((product) => (
                  <li key={product.id} className="flex items-center gap-3 text-sm">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex-1 truncate hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span
                      className={
                        product.stock === 0
                          ? "font-semibold text-destructive"
                          : "font-medium tabular-nums"
                      }
                    >
                      {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
