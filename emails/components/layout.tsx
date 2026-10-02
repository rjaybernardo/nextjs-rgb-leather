import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import type { EmailBrand } from "../brand";

export const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const colors = {
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  background: "#f4f4f5",
};

type EmailLayoutProps = {
  brand: EmailBrand;
  // Inbox preview line shown after the subject
  preview: string;
  children: ReactNode;
  // Why they got this email, shown in the footer
  reason: string;
};

export function EmailLayout({ brand, preview, children, reason }: EmailLayoutProps) {
  const contactLine = [brand.contact.email, brand.contact.phone].filter(Boolean).join(" · ");

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>

      <Body style={{ backgroundColor: colors.background, fontFamily, margin: 0, padding: "24px 0" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            maxWidth: 560,
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <Section style={{ borderTop: `4px solid ${brand.color}`, padding: "24px 32px 8px" }}>
            <Link href={brand.siteUrl} style={{ textDecoration: "none" }}>
              {brand.logoUrl ? (
                <Img src={brand.logoUrl} alt={brand.siteName} height={40} style={{ display: "block" }} />
              ) : (
                <Text style={{ color: brand.color, fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {brand.siteName}
                </Text>
              )}
            </Link>
          </Section>

          <Section style={{ padding: "8px 32px 24px", color: colors.text }}>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />

          <Section style={{ padding: "20px 32px", color: colors.muted, fontSize: 12, lineHeight: "18px" }}>
            <Text style={{ fontSize: 12, margin: "0 0 6px", color: colors.muted }}>
              <strong>{brand.siteName}</strong>
              {contactLine && ` · ${contactLine}`}
            </Text>

            {brand.contact.address && (
              <Text style={{ fontSize: 12, margin: "0 0 6px", color: colors.muted, whiteSpace: "pre-line" }}>
                {brand.contact.address}
              </Text>
            )}

            {brand.social.length > 0 && (
              <Text style={{ fontSize: 12, margin: "0 0 6px" }}>
                {brand.social.map((link, index) => (
                  <span key={link.label}>
                    {index > 0 && " · "}
                    <Link href={link.href} style={{ color: colors.muted, textDecoration: "underline" }}>
                      {link.label}
                    </Link>
                  </span>
                ))}
              </Text>
            )}

            <Text style={{ fontSize: 12, margin: 0, color: colors.muted }}>{reason}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
