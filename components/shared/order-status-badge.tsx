import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

const STATUS_DISPLAY: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  PAID: { label: "Paid", variant: "secondary" },
  SHIPPED: { label: "Shipped", variant: "secondary" },
  DELIVERED: { label: "Delivered", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const { label, variant } = STATUS_DISPLAY[status];

  return <Badge variant={variant}>{label}</Badge>;
};

export default OrderStatusBadge;
