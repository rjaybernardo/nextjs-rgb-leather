import { isAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import type { ShippingAddress } from "@/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const manilaDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(date)
        .replace(",", "")
    : "";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Dates are whole days in Philippine time
  const createdAt = {
    ...(from && DATE.test(from) ? { gte: new Date(`${from}T00:00:00+08:00`) } : {}),
    ...(to && DATE.test(to) ? { lte: new Date(`${to}T23:59:59.999+08:00`) } : {}),
  };

  const orders = await prisma.order.findMany({
    where: Object.keys(createdAt).length > 0 ? { createdAt } : {},
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      orderitems: {
        select: {
          qty: true,
        },
      },
    },
  });

  const header = [
    "Order ID",
    "Placed (PHT)",
    "Status",
    "Customer",
    "Email",
    "Mobile",
    "City",
    "Province",
    "Payment method",
    "Paid (PHT)",
    "Items",
    "Items total",
    "Shipping",
    "Coupon",
    "Discount",
    "VAT included",
    "Total",
    "Courier",
    "Tracking number",
    "Shipped (PHT)",
    "Delivered (PHT)",
  ];

  const rows = orders.map((order) => {
    const address = order.shippingAddress as Partial<ShippingAddress>;

    return [
      order.id,
      manilaDate(order.createdAt),
      order.status,
      order.user.name,
      order.user.email,
      address.phone,
      address.city,
      address.province,
      order.paymentMethod,
      manilaDate(order.paidAt),
      order.orderitems.reduce((sum, item) => sum + item.qty, 0),
      Number(order.itemsPrice).toFixed(2),
      Number(order.shippingPrice).toFixed(2),
      order.couponCode,
      Number(order.discountPrice).toFixed(2),
      Number(order.taxPrice).toFixed(2),
      Number(order.totalPrice).toFixed(2),
      order.courier,
      order.trackingNumber,
      manilaDate(order.shippedAt),
      manilaDate(order.deliveredAt),
    ];
  });

  const csv = toCsv([header, ...rows]);

  const range = [from, to].filter(Boolean).join("_to_") || "all";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${range}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
