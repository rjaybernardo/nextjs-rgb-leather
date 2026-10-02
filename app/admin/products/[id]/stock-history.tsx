import Link from "next/link";

import { getStockHistory } from "@/lib/actions/admin-log.actions";
import { cn, formatDateTime, formatId } from "@/lib/utils";

const REASON_LABELS = {
  PRODUCT_CREATED: "Product created",
  ADMIN_ADJUSTMENT: "Edited by admin",
  ORDER_PLACED: "Order placed",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_DELETED: "Order deleted",
} as const;

const StockHistory = async ({ productId }: { productId: string }) => {
  const movements = await getStockHistory(productId);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Stock history</h2>

      {movements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No stock changes recorded yet. Changes are logged from now on.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {movements.map((movement) => (
            <li
              key={movement.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm"
            >
              <span
                className={cn(
                  "w-12 font-mono font-semibold tabular-nums",
                  movement.change > 0 ? "text-emerald-600" : "text-destructive",
                )}
              >
                {movement.change > 0 ? "+" : ""}
                {movement.change}
              </span>

              <span className="min-w-36">
                {REASON_LABELS[movement.reason]}
                {movement.variantTitle && (
                  <span className="text-muted-foreground"> · {movement.variantTitle}</span>
                )}
              </span>

              <span className="text-muted-foreground tabular-nums">
                → {movement.stockAfter} left
              </span>

              {movement.orderId && (
                <Link
                  href={`/order/${movement.orderId}`}
                  className="font-mono text-xs hover:underline"
                >
                  order {formatId(movement.orderId)}
                </Link>
              )}

              <span className="ml-auto text-xs text-muted-foreground">
                {formatDateTime(movement.createdAt).dateTime}
                {movement.actorEmail && ` · ${movement.actorEmail}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default StockHistory;
