"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, Loader, Minus, Plus } from "lucide-react";

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
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { formatCurrency } from "@/lib/utils";
import type { Cart } from "@/types";

type CartTableProps = {
  cart?: Cart;
};

const CartTable = ({ cart }: CartTableProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = (productId: string) => {
    startTransition(async () => {
      const res = await removeItemFromCart(productId);

      if (!res.success) {
        console.error(res.message);
      }
    });
  };

  const handleAdd = (item: Cart["items"][number]) => {
    startTransition(async () => {
      const res = await addItemToCart(item);

      if (!res.success) {
        console.error(res.message);
      }
    });
  };

  const handleCheckout = () => {
    startTransition(() => {
      router.push("/shipping-address");
    });
  };

  return (
    <>
      <h1 className="h2-bold py-4">Shopping Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div>
          Cart is empty.{" "}
          <Link href="/" className="text-primary hover:underline">
            Go shopping
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.slug}>
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

                    <TableCell>
                      <div className="flex-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleRemove(item.productId)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          {isPending ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>

                        <span>{item.qty}</span>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAdd(item)}
                          aria-label={`Add one ${item.name}`}
                        >
                          {isPending ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardContent className="gap-4 p-4">
              <div className="pb-3 text-xl">
                Subtotal (
                {cart.items.reduce((total, item) => total + item.qty, 0)}):
                <span className="font-bold">
                  {" "}
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleCheckout}
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default CartTable;
