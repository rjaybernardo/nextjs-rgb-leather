import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import type { Order, ShippingAddress } from "@/types";

type OrderDetailsTableProps = {
  order: Order;
};

const OrderDetailsTable = ({ order }: OrderDetailsTableProps) => {
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

  return (
    <>
      <h1 className="py-4 text-2xl">Order {formatId(order.id)}</h1>

      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="space-y-4 overflow-x-auto md:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-4">
              <h2 className="pb-2 text-xl">Payment Method</h2>

              <p>{paymentMethod}</p>

              {isPaid && paidAt ? (
                <Badge variant="secondary">
                  Paid at {formatDateTime(paidAt).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not paid</Badge>
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
                <div>Tax</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>

              <div className="flex justify-between">
                <div>Shipping</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>

              <div className="flex justify-between font-bold">
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;
