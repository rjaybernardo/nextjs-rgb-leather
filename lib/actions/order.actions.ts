"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { calcPrice } from "@/lib/cart-pricing";
import { getShippingSettings } from "@/lib/store-settings";
import { getUserById } from "@/lib/actions/user.actions";
import { assertAdmin, isAdmin, requireAdmin } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import {
  orderCancelledEmail,
  orderPlacedEmail,
  orderShippedEmail,
} from "@/lib/email-templates";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { formatId } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import {
  insertOrderSchema,
  shipmentSchema,
  shippingAddressSchema,
} from "@/lib/validators";
import { recordAudit } from "@/lib/audit";
import { recordStockMovement } from "@/lib/stock";
import { checkCoupon, redeemCoupon, releaseCoupon } from "@/lib/coupons";
import { invalidateCatalog } from "@/lib/catalog-cache";
import { z } from "zod";
import type { CartItem } from "@/types";
import {
  LOW_STOCK_THRESHOLD,
  PAGE_SIZE,
  PAYMENT_METHODS,
  SERVER_URL,
} from "@/lib/constants";
import { syncPayMongoPayment } from "@/lib/order-payment";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  toCentavos,
} from "@/lib/paymongo";
import { Prisma } from "@/lib/generated/prisma/client";

type CreateOrderResult =
  | {
      success: true;
      message: string;
      redirectTo: string;
    }
  | {
      success: false;
      message: string;
      redirectTo?: string;
    };

export async function createOrder(): Promise<CreateOrderResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in to place an order",
        redirectTo: "/sign-in",
      };
    }

    const userId = session.user.id;

    await assertRateLimit({
      key: `order:${userId}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    const [cart, user] = await Promise.all([getMyCart(), getUserById(userId)]);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your cart is empty",
        redirectTo: "/cart",
      };
    }

    if (!shippingAddressSchema.safeParse(user.address).success) {
      return {
        success: false,
        message: "Please choose a complete shipping address",
        redirectTo: "/shipping-address",
      };
    }

    if (!user.paymentMethod || !PAYMENT_METHODS.includes(user.paymentMethod)) {
      return {
        success: false,
        message: "Please select a payment method",
        redirectTo: "/payment-method",
      };
    }

    // Re-price from the database: product details may have changed since
    // the items were added to the cart
    const cartItems = cart.items as CartItem[];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: cartItems.map((item) => item.productId),
        },
      },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    const unavailable = cartItems.find(
      (item) => !productsById.has(item.productId),
    );

    if (unavailable) {
      return {
        success: false,
        message: `${unavailable.name} is no longer available. Remove it from your cart to continue.`,
        redirectTo: "/cart",
      };
    }

    const items: CartItem[] = cartItems.map((item) => {
      const product = productsById.get(item.productId)!;

      return {
        ...item,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? item.image,
        price: Number(product.price),
      };
    });

    const shipping = await getShippingSettings();
    const basePrices = calcPrice(items, shipping);

    // Re-check the discount code against the current cart
    let coupon: Awaited<ReturnType<typeof checkCoupon>> | null = null;

    if (cart.couponCode) {
      coupon = await checkCoupon(cart.couponCode, {
        userId,
        itemsPrice: basePrices.itemsPrice,
      });

      if (!coupon.ok) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { items, ...basePrices, couponCode: null },
        });

        return {
          success: false,
          message: `${coupon.message}. We removed it; please review your order.`,
          redirectTo: "/place-order",
        };
      }
    }

    const prices = coupon?.ok ? calcPrice(items, shipping, coupon.rule) : basePrices;

    // Also catches totals saved under older tax or shipping rules
    const pricesChanged =
      prices.totalPrice !== cart.totalPrice ||
      items.some(
        (item, index) => item.price !== Number(cartItems[index].price),
      );

    if (pricesChanged) {
      await prisma.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items,
          ...prices,
        },
      });

      return {
        success: false,
        message:
          "Some prices changed since you added these items. Please review your order and place it again.",
        redirectTo: "/place-order",
      };
    }

    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: String(prices.itemsPrice),
      shippingPrice: String(prices.shippingPrice),
      taxPrice: String(prices.taxPrice),
      totalPrice: String(prices.totalPrice),
    });

    const appliedCoupon = coupon?.ok && prices.discountPrice > 0 ? coupon.coupon : null;

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({
        data: {
          ...order,
          discountPrice: prices.discountPrice,
          couponCode: appliedCoupon?.code ?? null,
        },
      });

      // Claim one use of the code (fails cleanly if the last use was just taken)
      if (appliedCoupon) {
        await redeemCoupon(tx, {
          couponId: appliedCoupon.id,
          orderId: insertedOrder.id,
          userId,
          amount: prices.discountPrice,
          perCustomerLimit: appliedCoupon.perCustomerLimit,
        });
      }

      // Decrement stock; the gte guard prevents overselling under concurrency
      for (const item of items) {
        const { count } = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.qty,
            },
          },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        });

        if (count === 0) {
          throw new Error(`Not enough stock for ${item.name}`);
        }

        await recordStockMovement(tx, {
          productId: item.productId,
          change: -item.qty,
          reason: "ORDER_PLACED",
          orderId: insertedOrder.id,
          actorEmail: user.email,
        });
      }

      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: insertedOrder.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          name: item.name,
          slug: item.slug,
          image: item.image,
        })),
      });

      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items: [],
          itemsPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: 0,
          discountPrice: 0,
          couponCode: null,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) {
      throw new Error("Order was not created");
    }

    // Stock changed
    invalidateCatalog();

    await sendEmail(
      await orderPlacedEmail(user.email, {
        id: insertedOrderId,
        totalPrice: prices.totalPrice,
        itemsPrice: prices.itemsPrice,
        shippingPrice: prices.shippingPrice,
        taxPrice: prices.taxPrice,
        discountPrice: prices.discountPrice,
        couponCode: appliedCoupon?.code,
        paymentMethod: order.paymentMethod,
        orderitems: items,
        address: order.shippingAddress,
      }),
    );

    return {
      success: true,
      message: "Order successfully created",
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Get order by ID (owner or admin only)
export async function getOrderById(orderId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return undefined;
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (
    !order ||
    (order.userId !== session.user.id && session.user.role !== "admin")
  ) {
    return undefined;
  }

  return {
    ...order,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    discountPrice: Number(order.discountPrice),
    orderitems: order.orderitems.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

// Get User Orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();

  if (!session) {
    throw new Error("User is not authenticated");
  }

  const [data, dataCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId: session.user.id!,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({
      where: {
        userId: session.user.id!,
      },
    }),
  ]);

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Get All Orders (Admin)
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  await requireAdmin();

  const queryFilter: Prisma.OrderWhereInput =
    query && query !== "all"
      ? {
          user: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        }
      : {};

  const [data, dataCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...queryFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.order.count({
      where: {
        ...queryFilter,
      },
    }),
  ]);

  return {
    data: data.map((order) => ({
      ...order,
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      totalPrice: Number(order.totalPrice),
    })),
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Statuses where the order still holds stock that hasn't left the shop
const STOCK_HELD_STATUSES = ["PENDING", "PAID"] as const;

// Delete Order (admin); returns stock if the order hadn't shipped
export async function deleteOrder(id: string) {
  try {
    const session = await assertAdmin();

    await prisma.$transaction(async (tx) => {
      // Give back the discount code use before the redemption is deleted
      await releaseCoupon(tx, id);

      const order = await tx.order.delete({
        where: {
          id,
        },
        include: {
          orderitems: true,
        },
      });

      if (
        (STOCK_HELD_STATUSES as readonly string[]).includes(order.status)
      ) {
        for (const item of order.orderitems) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.qty,
              },
            },
          });

          await recordStockMovement(tx, {
            productId: item.productId,
            change: item.qty,
            reason: "ORDER_DELETED",
            orderId: order.id,
            actorEmail: session.user.email,
          });
        }
      }
    });

    invalidateCatalog();

    await recordAudit({
      actor: session,
      action: "order.delete",
      entityType: "order",
      entityId: id,
    });

    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Order deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Cancel an unpaid, unshipped order (owner or admin); returns its stock
export async function cancelOrder(orderId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be signed in to cancel an order");
    }

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

    const isOwner = order?.userId === session.user.id;
    const canManage = isOwner || (await isAdmin());

    if (!order || !canManage) {
      throw new Error("Order not found");
    }

    await prisma.$transaction(async (tx) => {
      // The status guard makes this safe against a payment landing mid-cancel
      const { count } = await tx.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING",
          paidAt: null,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (count === 0) {
        throw new Error("Only unpaid orders that haven't shipped can be cancelled");
      }

      for (const item of order.orderitems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              increment: item.qty,
            },
          },
        });

        await recordStockMovement(tx, {
          productId: item.productId,
          change: item.qty,
          reason: "ORDER_CANCELLED",
          orderId: order.id,
          actorEmail: session.user.email,
        });
      }

      await releaseCoupon(tx, order.id);
    });

    invalidateCatalog();

    if (!isOwner) {
      await recordAudit({
        actor: session,
        action: "order.cancel",
        entityType: "order",
        entityId: order.id,
      });
    }

    await sendEmail(await orderCancelledEmail(order.user.email, order.id));

    revalidatePath(`/order/${order.id}`);
    revalidatePath("/admin/orders");
    revalidatePath("/user/orders");

    return {
      success: true,
      message: "Order cancelled",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Mark as shipped (admin): paid online orders, or COD orders not yet paid
export async function shipOrder(
  orderId: string,
  shipment: z.input<typeof shipmentSchema>,
) {
  try {
    const session = await assertAdmin();
    const { courier, trackingNumber } = shipmentSchema.parse(shipment);

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
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

    const canShip =
      order.status === "PAID" ||
      (order.status === "PENDING" && order.paymentMethod === "CashOnDelivery");

    if (!canShip) {
      throw new Error(
        order.status === "PENDING"
          ? "This order hasn't been paid yet"
          : `This order is already ${order.status.toLowerCase()}`,
      );
    }

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
        courier,
        trackingNumber: trackingNumber ?? null,
      },
    });

    await recordAudit({
      actor: session,
      action: "order.ship",
      entityType: "order",
      entityId: order.id,
      details: { courier, trackingNumber: trackingNumber ?? null },
    });

    await sendEmail(
      await orderShippedEmail(order.user.email, order.id, {
        courier,
        trackingNumber,
        cashOnDelivery: order.paymentMethod === "CashOnDelivery" && !order.paidAt,
      }),
    );

    revalidatePath(`/order/${orderId}`);
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Order marked as shipped",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Correct the courier or tracking number after shipping (admin)
export async function updateOrderTracking(
  orderId: string,
  shipment: z.input<typeof shipmentSchema>,
) {
  try {
    const session = await assertAdmin();
    const { courier, trackingNumber } = shipmentSchema.parse(shipment);

    const { count } = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: {
          in: ["SHIPPED", "DELIVERED"],
        },
      },
      data: {
        courier,
        trackingNumber: trackingNumber ?? null,
      },
    });

    if (count === 0) {
      throw new Error("Only shipped orders have tracking details");
    }

    await recordAudit({
      actor: session,
      action: "order.tracking.update",
      entityType: "order",
      entityId: orderId,
      details: { courier, trackingNumber: trackingNumber ?? null },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Tracking details updated",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Mark as delivered (admin); for COD this also records the cash payment
export async function deliverOrder(orderId: string) {
  try {
    const session = await assertAdmin();

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "SHIPPED") {
      throw new Error("Only shipped orders can be marked as delivered");
    }

    const now = new Date();
    const collectCash = order.paymentMethod === "CashOnDelivery" && !order.paidAt;

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "DELIVERED",
        deliveredAt: now,
        ...(collectCash
          ? {
              paidAt: now,
              paymentResult: {
                provider: "cod",
                status: "paid",
              },
            }
          : {}),
      },
    });

    await recordAudit({
      actor: session,
      action: "order.deliver",
      entityType: "order",
      entityId: orderId,
      details: { cashCollected: collectCash },
    });

    revalidatePath(`/order/${orderId}`);
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: collectCash
        ? "Order delivered and cash payment recorded"
        : "Order marked as delivered",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Revenue counts orders that were paid and not cancelled (cancelled-after-
// payment orders are awaiting a refund)
const REVENUE_ORDER_WHERE = {
  paidAt: {
    not: null,
  },
  status: {
    not: "CANCELLED",
  },
} satisfies Prisma.OrderWhereInput;

// Get sales data and order summary
export async function getOrderSummary() {
  await requireAdmin();

  const [
    ordersCount,
    paidOrdersCount,
    productsCount,
    usersCount,
    totalSalesResult,
    salesDataRaw,
    topProductsRaw,
    categorySalesRaw,
    lowStock,
    latestOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
    prisma.order.count({ where: REVENUE_ORDER_WHERE }),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: REVENUE_ORDER_WHERE,
      _sum: {
        totalPrice: true,
      },
    }),
    // Last 12 months of revenue, by the month the payment came in
    prisma.$queryRaw<{ month: string; totalSales: Prisma.Decimal }[]>`
      SELECT
        to_char(date_trunc('month', "paidAt"), 'Mon YY') AS "month",
        SUM("totalPrice") AS "totalSales"
      FROM "Order"
      WHERE "paidAt" IS NOT NULL
        AND "status" <> 'CANCELLED'
        AND "paidAt" >= date_trunc('month', now()) - interval '11 months'
      GROUP BY date_trunc('month', "paidAt")
      ORDER BY date_trunc('month', "paidAt") ASC
    `,
    prisma.$queryRaw<
      { productId: string; name: string; qty: bigint; revenue: Prisma.Decimal }[]
    >`
      SELECT oi."productId", max(oi."name") AS "name",
        SUM(oi."qty") AS "qty", SUM(oi."qty" * oi."price") AS "revenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."paidAt" IS NOT NULL AND o."status" <> 'CANCELLED'
      GROUP BY oi."productId"
      ORDER BY "revenue" DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ category: string; revenue: Prisma.Decimal }[]>`
      SELECT c."name" AS "category", SUM(oi."qty" * oi."price") AS "revenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      JOIN "Product" p ON p."id" = oi."productId"
      JOIN "Category" c ON c."id" = p."categoryId"
      WHERE o."paidAt" IS NOT NULL AND o."status" <> 'CANCELLED'
      GROUP BY c."name"
      ORDER BY "revenue" DESC
    `,
    prisma.product.findMany({
      where: {
        stock: {
          lte: LOW_STOCK_THRESHOLD,
        },
      },
      orderBy: {
        stock: "asc",
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
      take: 10,
    }),
    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      take: 6,
    }),
  ]);

  const totalSales = Number(totalSalesResult._sum.totalPrice ?? 0);

  return {
    ordersCount,
    paidOrdersCount,
    productsCount,
    usersCount,
    totalSales,
    averageOrderValue: paidOrdersCount > 0 ? totalSales / paidOrdersCount : 0,
    salesData: salesDataRaw.map((entry) => ({
      month: entry.month,
      totalSales: Number(entry.totalSales),
    })),
    topProducts: topProductsRaw.map((entry) => ({
      productId: entry.productId,
      name: entry.name,
      qty: Number(entry.qty),
      revenue: Number(entry.revenue),
    })),
    categorySales: categorySalesRaw.map((entry) => ({
      category: entry.category,
      revenue: Number(entry.revenue),
    })),
    lowStock,
    latestOrders,
  };
}

// Start (or resume) a PayMongo checkout for the signed-in user's order
export async function startPayMongoCheckout(orderId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be signed in to pay for an order");
    }

    await assertRateLimit({
      key: `checkout:${session.user.id}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        orderitems: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order || order.userId !== session.user.id) {
      throw new Error("Order not found");
    }

    if (order.paidAt) {
      throw new Error("This order is already paid");
    }

    if (order.status !== "PENDING") {
      throw new Error("This order can no longer be paid");
    }

    if (order.paymentMethod !== "PayMongo") {
      throw new Error("This order is not set up for online payment");
    }

    // Reuse an open checkout so the customer can't pay twice
    const existing = order.paymentResult as {
      checkoutSessionId?: string;
    } | null;

    if (existing?.checkoutSessionId) {
      const previous = await retrieveCheckoutSession(
        existing.checkoutSessionId,
      );

      if (previous.attributes.status === "active") {
        return {
          success: true,
          message: "Redirecting to PayMongo",
          redirectTo: previous.attributes.checkout_url,
        };
      }
    }

    type LineItem = {
      name: string;
      amount: number;
      currency: "PHP";
      quantity: number;
      images?: string[];
    };

    let lineItems: LineItem[];

    if (Number(order.discountPrice) > 0) {
      // PayMongo line items can't be negative, so a discounted order is
      // charged as one line at the discounted total
      const itemCount = order.orderitems.reduce((sum, item) => sum + item.qty, 0);

      lineItems = [
        {
          name: `Order ${formatId(order.id)}: ${itemCount} item${itemCount === 1 ? "" : "s"}${order.couponCode ? `, code ${order.couponCode}` : ""}`,
          amount: toCentavos(Number(order.totalPrice)),
          currency: "PHP",
          quantity: 1,
        },
      ];
    } else {
      lineItems = order.orderitems.map((item) => ({
        name: item.name,
        amount: toCentavos(Number(item.price)),
        currency: "PHP" as const,
        quantity: item.qty,
        ...(item.image.startsWith("https://") ? { images: [item.image] } : {}),
      }));

      const shippingPrice = Number(order.shippingPrice);

      if (shippingPrice > 0) {
        lineItems.push({
          name: "Shipping",
          amount: toCentavos(shippingPrice),
          currency: "PHP",
          quantity: 1,
        });
      }
    }

    const lineItemsTotal = lineItems.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0,
    );

    if (lineItemsTotal !== toCentavos(Number(order.totalPrice))) {
      throw new Error("Order total doesn't match its items");
    }

    const orderUrl = `${SERVER_URL}/order/${order.id}`;

    const checkout = await createCheckoutSession({
      lineItems,
      referenceNumber: order.id,
      description: `Order ${order.id}`,
      successUrl: `${orderUrl}?payment=success`,
      cancelUrl: `${orderUrl}?payment=cancelled`,
      billing: {
        name: order.user.name,
        email: order.user.email,
      },
      metadata: {
        orderId: order.id,
      },
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentResult: {
          provider: "paymongo",
          checkoutSessionId: checkout.id,
          status: "pending",
        },
      },
    });

    return {
      success: true,
      message: "Redirecting to PayMongo",
      redirectTo: checkout.attributes.checkout_url,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Called when the customer returns from PayMongo; re-checks with PayMongo
export async function confirmPayMongoPayment(orderId: string) {
  try {
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        userId: true,
      },
    });

    if (!order || order.userId !== session?.user?.id) {
      throw new Error("Order not found");
    }

    await syncPayMongoPayment(orderId);

    return {
      success: true,
      message: "Payment status updated",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
