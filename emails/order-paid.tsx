import { formatCurrency, formatId } from "@/lib/utils";

import type { EmailBrand } from "./brand";
import { EmailLayout } from "./components/layout";
import { CtaButton, OrderItems, Paragraph, Title, type EmailOrderItem, type EmailOrderTotals } from "./components/parts";

export type OrderPaidProps = {
  brand: EmailBrand;
  orderId: string;
  orderUrl: string;
  items: EmailOrderItem[];
  totals: EmailOrderTotals;
};

export default function OrderPaidEmail({ brand, orderId, orderUrl, items, totals }: OrderPaidProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`We received your payment of ${formatCurrency(totals.totalPrice)}`}
      reason="You're receiving this because you paid for an order."
    >
      <Title>Payment received</Title>
      <Paragraph>
        We received {formatCurrency(totals.totalPrice)} for order {formatId(orderId)}. We&apos;ll email
        you again when it ships.
      </Paragraph>

      <CtaButton brand={brand} href={orderUrl}>
        View your order
      </CtaButton>

      <OrderItems items={items} totals={totals} />
    </EmailLayout>
  );
}
