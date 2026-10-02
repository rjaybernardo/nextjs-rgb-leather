import { Text } from "@react-email/components";

import { formatId } from "@/lib/utils";

import type { EmailBrand } from "./brand";
import { colors, EmailLayout } from "./components/layout";
import { CtaButton, InfoBox, Paragraph, Title } from "./components/parts";

export type OrderShippedProps = {
  brand: EmailBrand;
  orderId: string;
  orderUrl: string;
  courier: string;
  trackingNumber?: string;
  cashOnDelivery?: boolean;
};

export default function OrderShippedEmail({ brand, orderId, orderUrl, courier, trackingNumber, cashOnDelivery }: OrderShippedProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Order ${formatId(orderId)} is on its way with ${courier}`}
      reason="You're receiving this because you placed an order."
    >
      <Title>Your order is on its way</Title>
      <Paragraph>Order {formatId(orderId)} has shipped with {courier}.</Paragraph>

      <InfoBox brand={brand}>
        <Text style={{ fontSize: 13, margin: "0 0 2px", color: colors.muted }}>Courier</Text>
        <Text style={{ fontSize: 15, margin: "0 0 10px", fontWeight: 600, color: colors.text }}>{courier}</Text>
        <Text style={{ fontSize: 13, margin: "0 0 2px", color: colors.muted }}>Tracking number</Text>
        <Text style={{ fontSize: 15, margin: 0, fontWeight: 600, fontFamily: "monospace", color: colors.text }}>
          {trackingNumber ?? "We'll share it if the courier provides one"}
        </Text>
      </InfoBox>

      {cashOnDelivery && (
        <Paragraph>Please have the exact amount ready to pay the rider in cash.</Paragraph>
      )}

      <CtaButton brand={brand} href={orderUrl}>
        Track your order
      </CtaButton>
    </EmailLayout>
  );
}
