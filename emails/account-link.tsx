import { Link, Text } from "@react-email/components";

import type { EmailBrand } from "./brand";
import { colors, EmailLayout } from "./components/layout";
import { CtaButton, Paragraph, Title } from "./components/parts";

export type AccountLinkProps = {
  brand: EmailBrand;
  kind: "reset" | "verify";
  url: string;
};

const COPY = {
  reset: {
    preview: "Reset your password",
    title: "Reset your password",
    body: "Someone asked to reset the password for your account. Use the button below to choose a new one.",
    button: "Reset password",
    expiry: "This link expires in 1 hour and can be used once.",
    ignore: "If this wasn't you, ignore this email. Your password won't change.",
    reason: "You're receiving this because a password reset was requested for your account.",
  },
  verify: {
    preview: "Confirm your email address",
    title: "Confirm your email",
    body: "Confirm your email address to finish setting up your account, so we can reach you about your orders.",
    button: "Confirm email",
    expiry: "This link expires in 24 hours.",
    ignore: "If you didn't create an account, you can ignore this email.",
    reason: "You're receiving this because this email was used to create an account.",
  },
} as const;

// Password reset and email confirmation share one layout
export default function AccountLinkEmail({ brand, kind, url }: AccountLinkProps) {
  const copy = COPY[kind];

  return (
    <EmailLayout brand={brand} preview={copy.preview} reason={copy.reason}>
      <Title>{copy.title}</Title>
      <Paragraph>{copy.body}</Paragraph>

      <CtaButton brand={brand} href={url}>
        {copy.button}
      </CtaButton>

      <Paragraph muted>{copy.expiry}</Paragraph>

      <Text style={{ fontSize: 12, lineHeight: "18px", color: colors.muted, margin: "0 0 16px", wordBreak: "break-all" }}>
        Button not working? Copy this link into your browser:
        <br />
        <Link href={url} style={{ color: colors.muted }}>
          {url}
        </Link>
      </Text>

      <Paragraph muted>{copy.ignore}</Paragraph>
    </EmailLayout>
  );
}
