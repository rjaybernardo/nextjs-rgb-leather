import { formatId } from "@/lib/utils";

import type { EmailBrand } from "./brand";
import { EmailLayout } from "./components/layout";
import { CtaButton, Paragraph, Title } from "./components/parts";

export type OrderCancelledProps = {
  brand: EmailBrand;
  orderId: string;
  orderUrl: string;
};

export default function OrderCancelledEmail({ brand, orderId, orderUrl }: OrderCancelledProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Order ${formatId(orderId)} was cancelled`}
      reason="You're receiving this because you placed an order."
    >
      <Title>Your order was cancelled</Title>
      <Paragraph>
        Order {formatId(orderId)} has been cancelled. You haven&apos;t been charged.
      </Paragraph>
      <Paragraph muted>If you didn&apos;t expect this, reply to this email or contact us.</Paragraph>

      <CtaButton brand={brand} href={orderUrl}>
        View order
      </CtaButton>
    </EmailLayout>
  );
}
