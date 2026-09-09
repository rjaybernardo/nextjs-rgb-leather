"use server";

import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";
import { insertOrderSchema } from "@/lib/validators";
import type { CartItem } from "@/types";
import { PAGE_SIZE } from "@/lib/constants";
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

    const [cart, user] = await Promise.all([getMyCart(), getUserById(userId)]);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your cart is empty",
        redirectTo: "/cart",
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: "Please add a shipping address",
        redirectTo: "/shipping-address",
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: "Please select a payment method",
        redirectTo: "/payment-method",
      };
    }

    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: String(cart.itemsPrice),
      shippingPrice: String(cart.shippingPrice),
      taxPrice: String(cart.taxPrice),
      totalPrice: String(cart.totalPrice),
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({
        data: order,
      });

      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            orderId: insertedOrder.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            name: item.name,
            slug: item.slug,
            image: item.image,
          },
        });
      }

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
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) {
      throw new Error("Order was not created");
    }

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

// Get order by ID
export async function getOrderById(orderId: string) {
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

  if (!order) {
    return undefined;
  }

  return {
    ...order,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
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

  const data = await prisma.order.findMany({
    where: {
      userId: session.user.id!,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: {
      userId: session.user.id!,
    },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Get All Orders (Admin)
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const data = await prisma.order.findMany({
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
  });

  const dataCount = await prisma.order.count();

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

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Get sales data and order summary
export async function getOrderSummary() {
  // Get counts for each resource
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  // Calculate total sales
  const totalSalesResult = await prisma.order.aggregate({
    _sum: {
      totalPrice: true,
    },
  });

  const totalSales = Number(totalSalesResult._sum.totalPrice ?? 0);

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{
      month: string;
      totalSales: Prisma.Decimal;
    }>
  >`
    SELECT
      to_char("createdAt", 'MM/YY') AS "month",
      SUM("totalPrice") AS "totalSales"
    FROM "Order"
    GROUP BY to_char("createdAt", 'MM/YY')
    ORDER BY MIN("createdAt") ASC
  `;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest orders
  const latestOrders = await prisma.order.findMany({
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
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestOrders,
    salesData,
  };
}
