"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import OrderStatusBadge from "@/components/shared/order-status-badge";
import { Badge } from "@/components/ui/badge";
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
import {
  cancelOrder,
  confirmPayMongoPayment,
  deliverOrder,
  shipOrder,
  startPayMongoCheckout,
} from "@/lib/actions/order.actions";
import { toast } from "@/components/ui/toast";
import { getPaymentMethodLabel } from "@/lib/constants";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import type { Order, ShippingAddress } from "@/types";

type OrderDetailsTableProps = {
  order: Order;
  isAdmin: boolean;
  isOwner: boolean;
  paymentReturn?: "success" | "cancelled";
};

type ActionResult = { success: boolean; message: string };

const OrderDetailsTable = ({
  order,
  isAdmin,
  isOwner,
  paymentReturn,
}: OrderDetailsTableProps) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const {
    shippingAddress,
    orderitems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    status,
    paidAt,
    shippedAt,
    deliveredAt,
    cancelledAt,
  } = order;

  const address = shippingAddress as ShippingAddress;

  const isCashOnDelivery = paymentMethod === "CashOnDelivery";

  const canPayOnline =
    isOwner && paymentMethod === "PayMongo" && status === "PENDING" && !paidAt;

  const canCancel = (isOwner || isAdmin) && status === "PENDING" && !paidAt;

  const canShip =
    isAdmin &&
    (status === "PAID" || (status === "PENDING" && isCashOnDelivery));

  const canDeliver = isAdmin && status === "SHIPPED";

  // Back from PayMongo: confirm the payment once, then clean up the URL
  const handledReturn = useRef(false);

  useEffect(() => {
    if (!paymentReturn || handledReturn.current) return;

    handledReturn.current = true;

    if (paymentReturn === "cancelled") {
      toast.add({
        type: "error",
        title: "Payment not completed",
        description: "You can try again whenever you're ready.",
      });
      router.replace(`/order/${order.id}`);
      return;
    }

    if (paidAt) {
      router.replace(`/order/${order.id}`);
      return;
    }

    startTransition(async () => {
      const result = await confirmPayMongoPayment(order.id);

      if (!result.success) {
        toast.add({ type: "error", description: result.message });
      }

      router.replace(`/order/${order.id}`);
      router.refresh();
    });
  }, [paymentReturn, paidAt, order.id, router]);

  function runAction(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handlePayOnline() {
    startTransition(async () => {
      const result = await startPayMongoCheckout(order.id);

      if (!result.success || !result.redirectTo) {
        toast.add({
          type: "error",
          title: "Unable to start payment",
          description: result.message,
        });
        return;
      }

      window.location.assign(result.redirectTo);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-4">
        <h1 className="text-2xl">Order {formatId(order.id)}</h1>
        <OrderStatusBadge status={status} />
      </div>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="space-y-4 overflow-x-auto md:col-span-2">
          {status === "CANCELLED" && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <h2 className="text-xl">Order cancelled</h2>
                <p className="text-muted-foreground">
                  {cancelledAt
                    ? `Cancelled on ${formatDateTime(cancelledAt).dateTime}.`
                    : "This order was cancelled."}{" "}
                  {paidAt
                    ? "A payment was received after cancellation and will be refunded."
                    : "No payment was taken."}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Payment</h2>

              <p>{getPaymentMethodLabel(paymentMethod)}</p>

              {paidAt ? (
                <Badge variant="secondary">
                  Paid on {formatDateTime(paidAt).dateTime}
                </Badge>
              ) : (
                <Badge variant="outline">
                  {isCashOnDelivery ? "Pay on delivery" : "Not paid"}
                </Badge>
              )}

              {canPayOnline && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={handlePayOnline}
                  >
                    {isPending ? "Please wait..." : "Pay now"}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Pay securely with GCash, Maya, card or QR Ph through
                    PayMongo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Shipping</h2>

              <p>{address.fullName}</p>

              <p>
                {address.streetAddress}, {address.city}, {address.postalCode},{" "}
                {address.country}
              </p>

              <div className="flex flex-wrap gap-2">
                {shippedAt && (
                  <Badge variant="secondary">
                    Shipped on {formatDateTime(shippedAt).dateTime}
                  </Badge>
                )}

                {deliveredAt && (
                  <Badge variant="secondary">
                    Delivered on {formatDateTime(deliveredAt).dateTime}
                  </Badge>
                )}

                {!shippedAt && status !== "CANCELLED" && (
                  <Badge variant="outline">Not shipped yet</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {(canShip || canDeliver || canCancel) && (
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-4">
                {canShip && (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => shipOrder(order.id))}
                  >
                    Mark as shipped
                  </Button>
                )}

                {canDeliver && (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => deliverOrder(order.id))}
                  >
                    {isCashOnDelivery && !paidAt
                      ? "Mark as delivered (cash collected)"
                      : "Mark as delivered"}
                  </Button>
                )}

                {canCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => runAction(() => cancelOrder(order.id))}
                  >
                    Cancel order
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Order Items</h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orderitems.map((item) => (
                    <TableRow key={`${item.productId}-${item.slug}`}>
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
                          />

                          <span className="px-2">{item.name}</span>
                        </Link>
                      </TableCell>

                      <TableCell>{item.qty}</TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Order Summary</h2>

              <div className="flex justify-between">
                <div>Items</div>
                <div>{formatCurrency(itemsPrice)}</div>
              </div>

              <div className="flex justify-between">
                <div>Shipping</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>

              <div className="flex justify-between font-bold">
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <div>Includes 12% VAT</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;
