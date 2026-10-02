import { formatCurrency, formatId } from "@/lib/utils";

import type { EmailBrand } from "./brand";
import { EmailLayout } from "./components/layout";
import {
  CtaButton,
  DeliveryAddress,
  InfoBox,
  OrderItems,
  Paragraph,
  Title,
  type EmailAddress,
  type EmailOrderItem,
  type EmailOrderTotals,
} from "./components/parts";

export type OrderPlacedProps = {
  brand: EmailBrand;
  orderId: string;
  orderUrl: string;
  payOnline: boolean;
  items: EmailOrderItem[];
  totals: EmailOrderTotals;
  address?: EmailAddress;
};

export default function OrderPlacedEmail({ brand, orderId, orderUrl, payOnline, items, totals, address }: OrderPlacedProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Order ${formatId(orderId)} received: ${formatCurrency(totals.totalPrice)}`}
      reason="You're receiving this because you placed an order."
    >
      <Title>Thanks for your order</Title>
      <Paragraph muted>Order {formatId(orderId)}</Paragraph>

      <InfoBox brand={brand}>
        <Paragraph flush>
          {payOnline
            ? "Your order is reserved. Complete your payment with GCash, Maya, card or QR Ph so we can prepare it."
            : "You chose cash on delivery. Please have the exact amount ready when your order arrives."}
        </Paragraph>
      </InfoBox>

      <CtaButton brand={brand} href={orderUrl}>
        {payOnline ? "Complete payment" : "View your order"}
      </CtaButton>

      <OrderItems items={items} totals={totals} />

      {address && <DeliveryAddress address={address} />}
    </EmailLayout>
  );
}
