import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import SiteLogo from "@/components/shared/site-logo";
import { getAllCategories } from "@/lib/actions/product.actions";
import { getFooterPages, getSiteSettings } from "@/lib/site";

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopee: "Shopee",
  lazada: "Lazada",
} as const;

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

  const hasContact = contact.email || contact.phone || contact.address;

  const copyright =
    footer.copyright ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="wrapper grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo size={40} />
            <span className="text-lg font-bold">{siteName}</span>
          </Link>

          {footer.about && (
            <p className="text-sm text-muted-foreground">{footer.about}</p>
          )}

          {socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Social media and marketplaces">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full border px-3 py-1 text-xs font-medium hover:bg-background"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop">
          <h2 className="mb-3 text-sm font-semibold">Shop</h2>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/search" className="hover:text-foreground">
                All products
              </Link>
            </li>

            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/search?${new URLSearchParams({ category: category.slug })}`}
                  className="hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="mb-3 text-sm font-semibold">Help</h2>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/user/orders" className="hover:text-foreground">
                Track your order
              </Link>
            </li>

            {pages.map((page) => (
              <li key={page.slug}>
                <Link href={`/pages/${page.slug}`} className="hover:text-foreground">
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {hasContact && (
          <div>
            <h2 className="mb-3 text-sm font-semibold">Contact</h2>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {contact.email && (
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="select-all break-all">{contact.email}</span>
                </li>
              )}

              {contact.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="select-all">{contact.phone}</span>
                </li>
              )}

              {contact.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-pre-line">{contact.address}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t">
        <p className="wrapper py-4 text-center text-xs text-muted-foreground">
          {copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
