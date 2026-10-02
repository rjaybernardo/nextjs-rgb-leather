"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
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

      const items = cart.items as CartItem[];

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

// Delete Order
export async function deleteOrder(id: string) {
  try {
    await assertAdmin();

    await prisma.order.delete({
      where: {
        id,
      },
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

// Update Order To Paid
async function updateOrderToPaid({ orderId }: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.isPaid) {
    return;
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      isPaid: true,
      paidAt: new Date(),
    },
  });
}

// Update Order To Paid By COD
export async function updateOrderToPaidByCOD(orderId: string) {
  try {
    await assertAdmin();

    await updateOrderToPaid({
      orderId,
    });

    revalidatePath(`/order/${orderId}`);
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Order paid successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update Order To Delivered
export async function deliverOrder(orderId: string) {
  try {
    await assertAdmin();

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.isPaid) {
      throw new Error("Order is not paid");
    }

    if (order.isDelivered) {
      return {
        success: true,
        message: "Order is already delivered",
      };
    }

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/order/${orderId}`);
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Order delivered successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Get sales data and order summary
export async function getOrderSummary() {
  await requireAdmin();

  const [
    ordersCount,
    productsCount,
    usersCount,
    totalSalesResult,
    salesDataRaw,
    latestOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.$queryRaw<
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
    `,
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

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestOrders,
    salesData,
  };
}
