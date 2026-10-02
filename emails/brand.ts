import "server-only";

import { SERVER_URL } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site";
import { contrastText } from "@/lib/site-config";

export type EmailBrand = {
  siteName: string;
  siteUrl: string;
  // Absolute PNG/JPG URL; null when there's no logo or it's an SVG
  // (Gmail and Outlook don't show SVG images)
  logoUrl: string | null;
  color: string;
  colorText: string;
  contact: { email: string; phone: string; address: string };
  social: { label: string; href: string }[];
};

export const absoluteUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${SERVER_URL}${path.startsWith("/") ? "" : "/"}${path}`;

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopee: "Shopee",
  lazada: "Lazada",
} as const;

// Branding for emails, from Site Studio
export async function getEmailBrand(): Promise<EmailBrand> {
  const settings = await getSiteSettings();
  const logo = settings.logoUrl;

  return {
    siteName: settings.siteName,
    siteUrl: SERVER_URL,
    logoUrl: logo && !/\.svg(\?|$)/i.test(logo) ? absoluteUrl(logo) : null,
    color: settings.theme.primaryColor,
    colorText: contrastText(settings.theme.primaryColor),
    contact: settings.contact,
    social: (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[])
      .filter((key) => settings.social[key])
      .map((key) => ({ label: SOCIAL_LABELS[key], href: absoluteUrl(settings.social[key]) })),
  };
}
