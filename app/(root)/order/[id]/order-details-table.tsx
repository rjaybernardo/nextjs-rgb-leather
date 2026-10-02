"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

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
  confirmPayMongoPayment,
  deliverOrder,
  startPayMongoCheckout,
  updateOrderToPaidByCOD,
} from "@/lib/actions/order.actions";
import { getPaymentMethodLabel } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import type { Order, ShippingAddress } from "@/types";

type OrderDetailsTableProps = {
  order: Order;
  isAdmin: boolean;
  isOwner: boolean;
  paymentReturn?: "success" | "cancelled";
};

const OrderDetailsTable = ({
  order,
  isAdmin,
  isOwner,
  paymentReturn,
}: OrderDetailsTableProps) => {
  const router = useRouter();

  const [isPayPending, startPayTransition] = useTransition();

  const [isPaidPending, startPaidTransition] = useTransition();

  const [isDeliveredPending, startDeliveredTransition] = useTransition();

  const {
    shippingAddress,
    orderitems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
  } = order;

  const address = shippingAddress as ShippingAddress;

  const isCashOnDelivery = paymentMethod === "CashOnDelivery";

  const canMarkAsPaid = isAdmin && isCashOnDelivery && !isPaid;

  const canMarkAsDelivered = isAdmin && isPaid && !isDelivered;

  const canPayOnline = isOwner && paymentMethod === "PayMongo" && !isPaid;

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

    if (isPaid) {
      router.replace(`/order/${order.id}`);
      return;
    }

    startPayTransition(async () => {
      const result = await confirmPayMongoPayment(order.id);

      if (!result.success) {
        toast.add({ type: "error", description: result.message });
      }

      router.replace(`/order/${order.id}`);
      router.refresh();
    });
  }, [paymentReturn, isPaid, order.id, router]);

  function handlePayOnline() {
    startPayTransition(async () => {
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

  function handleMarkAsPaid() {
    startPaidTransition(async () => {
      const result = await updateOrderToPaidByCOD(order.id);

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleMarkAsDelivered() {
    startDeliveredTransition(async () => {
      const result = await deliverOrder(order.id);

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <h1 className="py-4 text-2xl">Order {formatId(order.id)}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="space-y-4 overflow-x-auto md:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Payment Method</h2>

              <p>{getPaymentMethodLabel(paymentMethod)}</p>

              {isPaid && paidAt ? (
                <Badge variant="secondary">
                  Paid at {formatDateTime(paidAt).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not paid</Badge>
              )}

              {canPayOnline && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    disabled={isPayPending}
                    onClick={handlePayOnline}
                  >
                    {isPayPending ? "Please wait..." : "Pay now"}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Pay securely with GCash, Maya, card or QR Ph through
                    PayMongo.
                  </p>
                </div>
              )}

              {canMarkAsPaid && (
                <div>
                  <Button
                    type="button"
                    disabled={isPaidPending}
                    onClick={handleMarkAsPaid}
                  >
                    {isPaidPending ? "Processing..." : "Mark As Paid"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Shipping Address</h2>

              <p>{address.fullName}</p>

              <p>
                {address.streetAddress}, {address.city}, {address.postalCode},{" "}
                {address.country}
              </p>

              {isDelivered && deliveredAt ? (
                <Badge variant="secondary">
                  Delivered at {formatDateTime(deliveredAt).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not delivered</Badge>
              )}

              {canMarkAsDelivered && (
                <div>
                  <Button
                    type="button"
                    disabled={isDeliveredPending}
                    onClick={handleMarkAsDelivered}
                  >
                    {isDeliveredPending ? "Processing..." : "Mark As Delivered"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
