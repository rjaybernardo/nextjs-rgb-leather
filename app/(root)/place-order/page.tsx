import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { formatCurrency } from "@/lib/utils";
import type { ShippingAddress } from "@/types";

import PlaceOrderForm from "./place-order-form";

export const metadata: Metadata = {
  title: "Place Order",
};

const PlaceOrderPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  const [cart, user] = await Promise.all([getMyCart(), getUserById(userId)]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  if (!user.address) {
    redirect("/shipping-address");
  }

  if (!user.paymentMethod) {
    redirect("/payment-method");
  }

  const userAddress = user.address as ShippingAddress;

  return (
    <>
      <CheckoutSteps current={3} />

      <h1 className="py-4 text-2xl">Place Order</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="space-y-4 overflow-x-auto md:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="text-xl">Shipping Address</h2>

              <div className="space-y-1">
                <p>{userAddress.fullName}</p>

                <p>
                  {userAddress.streetAddress}, {userAddress.city},{" "}
                  {userAddress.postalCode}, {userAddress.country}
                </p>
              </div>

              <Link href="/shipping-address">
                <Button variant="outline">Edit</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="text-xl">Payment Method</h2>

              <p>{user.paymentMethod}</p>

              <Link href="/payment-method">
                <Button variant="outline">Edit</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="text-xl">Order Items</h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                            className="rounded"
                          />

                          <span className="px-2">{item.name}</span>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="px-2">{item.qty}</span>
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(Number(item.price))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Link href="/cart">
                <Button variant="outline">Edit</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{formatCurrency(cart.itemsPrice)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(cart.taxPrice)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(cart.shippingPrice)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(cart.totalPrice)}</span>
              </div>

              <PlaceOrderForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PlaceOrderPage;
