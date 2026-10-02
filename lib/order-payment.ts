import "server-only";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/lib/generated/prisma/client";
import {
  retrieveCheckoutSession,
  toCentavos,
  type PayMongoCheckoutSession,
} from "@/lib/paymongo";
import { sendEmail } from "@/lib/email";
import { orderPaidEmail } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

// Not a server action: only server code (admin actions, webhook) can call this
export async function markOrderPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: Prisma.InputJsonValue;
}) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Only the first confirmation records the payment (webhook and return
  // check can race). A payment on a cancelled order is recorded but leaves
  // it cancelled, so an admin can refund it.
  const { count } = await prisma.order.updateMany({
    where: {
      id: orderId,
      paidAt: null,
    },
    data: {
      paidAt: new Date(),
      ...(order.status === "PENDING" ? { status: "PAID" as const } : {}),
      ...(paymentResult !== undefined ? { paymentResult } : {}),
    },
  });

  if (count === 0) {
    return;
  }

  await sendEmail(
    await orderPaidEmail(order.user.email, {
      id: order.id,
      totalPrice: Number(order.totalPrice),
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      discountPrice: Number(order.discountPrice),
      couponCode: order.couponCode,
      paymentMethod: order.paymentMethod,
      orderitems: order.orderitems.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: Number(item.price),
        image: item.image,
      })),
    }),
  );

  revalidatePath(`/order/${orderId}`);
  revalidatePath("/admin/orders");
}

/*
 * Marks the order paid if the checkout session has a paid payment covering
 * the order total. Always re-fetch the session from PayMongo before calling
 * this; never trust a redirect or an unverified payload.
 */
export async function applyPaidCheckoutSession(
  session: PayMongoCheckoutSession,
) {
  const orderId =
    session.attributes.metadata?.orderId ?? session.attributes.reference_number;

  if (!orderId) {
    return { paid: false };
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    return { paid: false };
  }

  if (order.paidAt) {
    return { paid: true };
  }

  const paidPayments = session.attributes.payments.filter(
    (payment) => payment.attributes.status === "paid",
  );

  const paidAmount = paidPayments.reduce(
    (sum, payment) => sum + payment.attributes.amount,
    0,
  );

  if (paidPayments.length === 0 || paidAmount < toCentavos(Number(order.totalPrice))) {
    return { paid: false };
  }

  await markOrderPaid({
    orderId: order.id,
    paymentResult: {
      provider: "paymongo",
      checkoutSessionId: session.id,
      paymentIds: paidPayments.map((payment) => payment.id),
      amount: paidAmount / 100,
      status: "paid",
    },
  });

  return { paid: true };
}

// Used when the customer returns from PayMongo, in case the webhook is slow
// or can't reach this server (e.g. local development)
export async function syncPayMongoPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  const paymentResult = order?.paymentResult as {
    checkoutSessionId?: string;
  } | null;

  if (!order || order.paidAt || !paymentResult?.checkoutSessionId) {
    return;
  }

  const session = await retrieveCheckoutSession(paymentResult.checkoutSessionId);

  await applyPaidCheckoutSession(session);
}
