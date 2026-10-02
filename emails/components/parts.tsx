import { Button, Column, Heading, Img, Row, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

import { formatCurrency } from "@/lib/utils";

import type { EmailBrand } from "../brand";
import { colors } from "./layout";

export function Title({ children }: { children: ReactNode }) {
  return (
    <Heading as="h1" style={{ fontSize: 22, lineHeight: "30px", margin: "16px 0 8px", color: colors.text }}>
      {children}
    </Heading>
  );
}

export function Paragraph({
  children,
  muted,
  flush,
}: {
  children: ReactNode;
  muted?: boolean;
  // No bottom margin, e.g. inside an InfoBox
  flush?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: 15,
        lineHeight: "24px",
        margin: flush ? 0 : "0 0 16px",
        color: muted ? colors.muted : colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function CtaButton({ brand, href, children }: { brand: EmailBrand; href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: brand.color,
          color: brand.colorText,
          borderRadius: 6,
          fontSize: 15,
          fontWeight: 600,
          padding: "12px 22px",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export type EmailOrderItem = {
  name: string;
  qty: number;
  price: number;
  imageUrl?: string | null;
};

export type EmailOrderTotals = {
  itemsPrice?: number;
  shippingPrice?: number;
  taxPrice?: number;
  discountPrice?: number;
  couponCode?: string;
  totalPrice: number;
};

const cell = { fontSize: 14, color: colors.text, padding: "6px 0" };

export function OrderItems({ items, totals }: { items: EmailOrderItem[]; totals: EmailOrderTotals }) {
  return (
    <Section style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", margin: "0 0 20px" }}>
      {items.map((item, index) => (
        <Row key={`${item.name}-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
          {item.imageUrl && (
            <Column style={{ width: 56, padding: "8px 12px 8px 0" }}>
              <Img
                src={item.imageUrl}
                alt=""
                width={48}
                height={48}
                style={{ borderRadius: 6, objectFit: "cover", display: "block" }}
              />
            </Column>
          )}
          <Column style={cell}>
            {item.name}
            <br />
            <span style={{ color: colors.muted, fontSize: 13 }}>Qty {item.qty}</span>
          </Column>
          <Column style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
            {formatCurrency(item.price * item.qty)}
          </Column>
        </Row>
      ))}

      {totals.itemsPrice !== undefined && (
        <Row>
          <Column style={{ ...cell, color: colors.muted }}>Subtotal</Column>
          <Column style={{ ...cell, textAlign: "right" }}>{formatCurrency(totals.itemsPrice)}</Column>
        </Row>
      )}

      {totals.shippingPrice !== undefined && (
        <Row>
          <Column style={{ ...cell, color: colors.muted }}>Shipping</Column>
          <Column style={{ ...cell, textAlign: "right" }}>
            {totals.shippingPrice === 0 ? "Free" : formatCurrency(totals.shippingPrice)}
          </Column>
        </Row>
      )}

      {totals.discountPrice !== undefined && totals.discountPrice > 0 && (
        <Row>
          <Column style={{ ...cell, color: colors.muted }}>
            Discount{totals.couponCode ? ` (${totals.couponCode})` : ""}
          </Column>
          <Column style={{ ...cell, textAlign: "right" }}>−{formatCurrency(totals.discountPrice)}</Column>
        </Row>
      )}

      <Row>
        <Column style={{ ...cell, fontWeight: 700 }}>Total</Column>
        <Column style={{ ...cell, fontWeight: 700, textAlign: "right" }}>{formatCurrency(totals.totalPrice)}</Column>
      </Row>

      {totals.taxPrice !== undefined && (
        <Row>
          <Column style={{ ...cell, color: colors.muted, fontSize: 12 }}>Includes 12% VAT</Column>
          <Column style={{ ...cell, color: colors.muted, fontSize: 12, textAlign: "right" }}>
            {formatCurrency(totals.taxPrice)}
          </Column>
        </Row>
      )}
    </Section>
  );
}

export type EmailAddress = {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

export function DeliveryAddress({ address }: { address: EmailAddress }) {
  const cityLine = [address.city, address.province].filter(Boolean).join(", ");

  return (
    <Section style={{ margin: "0 0 20px" }}>
      <Text style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Delivering to
      </Text>
      <Text style={{ fontSize: 14, lineHeight: "21px", margin: 0, color: colors.text }}>
        {address.fullName}
        {address.phone && ` · ${address.phone}`}
        <br />
        {address.streetAddress}
        <br />
        {[cityLine, address.postalCode].filter(Boolean).join(" ")}
      </Text>
    </Section>
  );
}

export function InfoBox({ brand, children }: { brand: EmailBrand; children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: colors.background,
        borderLeft: `4px solid ${brand.color}`,
        borderRadius: 6,
        padding: "12px 16px",
        margin: "0 0 20px",
      }}
    >
      {children}
    </Section>
  );
}
