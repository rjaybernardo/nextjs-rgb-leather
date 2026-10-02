import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import AccentText from "@/components/shared/accent-text";
import Wordmark from "@/components/shared/header/wordmark";
import { getAllCategories } from "@/lib/actions/product.actions";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getFooterPages, getSiteSettings } from "@/lib/site";

import FooterNewsletter from "./footer-newsletter";

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopee: "Shopee",
  lazada: "Lazada",
} as const;

// Chips for the payment methods this shop actually takes
const PAYMENT_CHIPS: Record<string, string[]> = {
  PayMongo: ["GCash", "Maya", "Visa", "Mastercard", "QR Ph"],
  CashOnDelivery: ["Cash on delivery"],
};

const columnLink = "text-[var(--on-night-muted)] transition-colors hover:text-[var(--on-night)]";

const Footer = async () => {
  const [settings, pages, categories] = await Promise.all([
    getSiteSettings(),
    getFooterPages(),
    getAllCategories(),
  ]);

  const { siteName, footer, contact, social } = settings;

  const socialLinks = (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[])
    .filter((key) => social[key])
    .map((key) => ({ label: SOCIAL_LABELS[key], href: social[key] }));

  const chips = PAYMENT_METHODS.flatMap((method) => PAYMENT_CHIPS[method] ?? []);

  const copyright =
    footer.copyright || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="bg-[var(--night)] text-[var(--on-night)]">
      <div className="wrap flex flex-col gap-16 pb-8 pt-[clamp(56px,7vw,96px)]">
        {(footer.newsletterTitle || footer.newsletterText) && (
          <div className="grid items-end gap-[clamp(32px,5vw,80px)] border-b border-[rgba(243,236,227,0.14)] pb-14 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3.5">
              {footer.newsletterTitle && (
                <h2 className="h-section text-[var(--on-night)]">
                  <AccentText text={footer.newsletterTitle} />
                </h2>
              )}
              {footer.newsletterText && (
                <p className="max-w-[42ch] text-[var(--on-night-muted)]">{footer.newsletterText}</p>
              )}
            </div>

            <FooterNewsletter />
          </div>
        )}

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <Link href="/" className="w-fit" aria-label={`${siteName} home`}>
              <Wordmark size="lg" className="[&_.text-muted-foreground]:text-[var(--on-night-muted)]" />
            </Link>

            {footer.about && (
              <p className="max-w-[34ch] text-sm text-[var(--on-night-muted)]">{footer.about}</p>
            )}

            {socialLinks.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Social media and marketplaces">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center rounded-full border border-[rgba(243,236,227,0.22)] px-3.5 text-xs font-semibold text-[var(--on-night)] hover:bg-[rgba(243,236,227,0.08)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Shop" className="flex flex-col gap-3 text-sm">
            <h2 className="mb-1 font-semibold">Shop</h2>
            <Link href="/search" className={columnLink}>All products</Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.slug}
                href={`/search?${new URLSearchParams({ category: category.slug })}`}
                className={columnLink}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <nav aria-label="Help" className="flex flex-col gap-3 text-sm">
            <h2 className="mb-1 font-semibold">Help</h2>
            <Link href="/user/orders" className={columnLink}>Track your order</Link>
            {pages.map((page) => (
              <Link key={page.slug} href={`/pages/${page.slug}`} className={columnLink}>
                {page.title}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <h2 className="mb-1 font-semibold">Contact</h2>
            {contact.email && (
              <span className="flex items-start gap-2 text-[var(--on-night-muted)]">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="select-all break-all">{contact.email}</span>
              </span>
            )}
            {contact.phone && (
              <span className="flex items-start gap-2 text-[var(--on-night-muted)]">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="select-all">{contact.phone}</span>
              </span>
            )}
            {contact.address && (
              <span className="flex items-start gap-2 whitespace-pre-line text-[var(--on-night-muted)]">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {contact.address}
              </span>
            )}
            <Link href="/user/profile" className={columnLink}>Your account</Link>
            <Link href="/user/wishlist" className={columnLink}>Wishlist</Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[rgba(243,236,227,0.14)] pt-6 text-[13px] text-[var(--on-night-muted)]">
          <span>{copyright}</span>

          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Ways to pay">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="inline-flex h-7 items-center rounded border border-[rgba(243,236,227,0.22)] px-2.5 text-xs font-semibold"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
