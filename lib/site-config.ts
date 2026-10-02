import { z } from "zod";

/*
 * Site Studio configuration: schemas, defaults and editor field definitions
 * for site settings, home page sections and pages. Used on the server (to
 * validate saves) and in the browser (to render the Studio editors).
 */

// ---------------------------------------------------------------- helpers

// Empty, a site path ("/search"), or an http(s) URL
const link = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
    "Use a path like /search or a full https:// link",
  );

const optionalText = (max: number) => z.string().trim().max(max);

// Images must be on this site or uploaded to UploadThing: the security policy
// and the image optimizer only allow those hosts
export const isAllowedImageUrl = (value: string) =>
  value === "" ||
  value.startsWith("/") ||
  /^https:\/\/(utfs\.io|[a-z0-9-]+\.ufs\.sh)\//.test(value);

const imageLink = z
  .string()
  .trim()
  .max(500)
  .refine(isAllowedImageUrl, "Upload the image here, or use a path like /images/banner.jpg");

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color like #8A4B22");

// ---------------------------------------------------------------- settings

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter (clean, modern)" },
  { value: "poppins", label: "Poppins (friendly, rounded)" },
  { value: "montserrat", label: "Montserrat (bold, geometric)" },
  { value: "lora", label: "Lora (classic serif)" },
  { value: "playfair", label: "Playfair Display (elegant serif)" },
] as const;

export const RADIUS_OPTIONS = [
  { value: "none", label: "Square", rem: "0rem" },
  { value: "sm", label: "Slightly rounded", rem: "0.375rem" },
  { value: "md", label: "Rounded", rem: "0.625rem" },
  { value: "lg", label: "Very rounded", rem: "1rem" },
] as const;

export const THEME_PRESETS = [
  { name: "Saddle", color: "#8A4B22" },
  { name: "Espresso", color: "#4A2C21" },
  { name: "Charcoal", color: "#1F2937" },
  { name: "Oxblood", color: "#6B1F2A" },
  { name: "Forest", color: "#24543A" },
  { name: "Navy", color: "#1E3A5F" },
] as const;

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(2, "Site name must be at least 2 characters").max(60),
  tagline: optionalText(120),
  description: optionalText(300),
  logoUrl: imageLink,
  ogImageUrl: imageLink,

  contact: z.object({
    email: z.union([z.literal(""), z.email({ error: "Enter a valid email" })]),
    phone: optionalText(40),
    address: optionalText(200),
  }),

  social: z.object({
    facebook: link,
    instagram: link,
    tiktok: link,
    shopee: link,
    lazada: link,
  }),

  theme: z.object({
    primaryColor: hexColor,
    radius: z.enum(RADIUS_OPTIONS.map((option) => option.value) as ["none", "sm", "md", "lg"]),
    font: z.enum(
      FONT_OPTIONS.map((option) => option.value) as [
        "inter",
        "poppins",
        "montserrat",
        "lora",
        "playfair",
      ],
    ),
    defaultMode: z.enum(["system", "light", "dark"]),
  }),

  announcement: z.object({
    enabled: z.boolean(),
    text: optionalText(140),
    linkText: optionalText(40),
    linkUrl: link,
  }),

  footer: z.object({
    about: optionalText(300),
    copyright: optionalText(120),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME || "RGB Leather",
  tagline: "Handcrafted leather goods",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Handcrafted leather goods.",
  logoUrl: "",
  ogImageUrl: "",
  contact: { email: "", phone: "", address: "" },
  social: { facebook: "", instagram: "", tiktok: "", shopee: "", lazada: "" },
  theme: {
    primaryColor: "#8A4B22",
    radius: "md",
    font: "inter",
    defaultMode: "system",
  },
  announcement: {
    enabled: false,
    text: "Free shipping on orders over ₱3,000",
    linkText: "Shop now",
    linkUrl: "/search",
  },
  footer: {
    about: "Leather goods made to last, shipped anywhere in the Philippines.",
    copyright: "",
  },
};

// Saved settings merged over the defaults, so new fields get sensible values
export function resolveSiteSettings(saved: unknown): SiteSettings {
  const base = DEFAULT_SITE_SETTINGS;
  const value = (saved && typeof saved === "object" ? saved : {}) as Partial<SiteSettings>;

  const merged = {
    ...base,
    ...value,
    contact: { ...base.contact, ...value.contact },
    social: { ...base.social, ...value.social },
    theme: { ...base.theme, ...value.theme },
    announcement: { ...base.announcement, ...value.announcement },
    footer: { ...base.footer, ...value.footer },
  };

  const parsed = siteSettingsSchema.safeParse(merged);

  return parsed.success ? parsed.data : base;
}

// ---------------------------------------------------------------- sections

export const FEATURE_ICONS = [
  "ShoppingBag",
  "Truck",
  "ShieldCheck",
  "RotateCcw",
  "BadgeCheck",
  "WalletCards",
  "Headset",
  "Gift",
  "Award",
  "Hammer",
  "Leaf",
  "Sparkles",
] as const;

const featureItem = z.object({
  icon: z.enum(FEATURE_ICONS),
  title: z.string().trim().min(1, "Add a title").max(60),
  text: optionalText(160),
});

export const sectionSchemas = {
  hero: z.object({
    heading: z.string().trim().min(1, "Add a heading").max(100),
    subheading: optionalText(240),
    imageUrl: imageLink,
    ctaText: optionalText(40),
    ctaUrl: link,
    align: z.enum(["left", "center"]),
  }),
  featured_carousel: z.object({
    title: optionalText(80),
  }),
  newest_products: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    count: z.coerce.number().int().min(4).max(12),
  }),
  category_grid: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    subtitle: optionalText(160),
  }),
  deal: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    description: optionalText(300),
    endsAt: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Choose an end date and time"),
    imageUrl: imageLink,
    ctaText: optionalText(40),
    ctaUrl: link,
  }),
  features: z.object({
    title: optionalText(80),
    items: z.array(featureItem).min(1, "Add at least one item").max(8),
  }),
  story: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    body: z.string().trim().min(1, "Write your story").max(2000),
    imageUrl: imageLink,
    imageSide: z.enum(["left", "right"]),
    ctaText: optionalText(40),
    ctaUrl: link,
  }),
  testimonials: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    items: z
      .array(
        z.object({
          quote: z.string().trim().min(1, "Add the quote").max(400),
          name: z.string().trim().min(1, "Add a name").max(60),
          location: optionalText(60),
        }),
      )
      .min(1, "Add at least one testimonial")
      .max(12),
  }),
  faq: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    items: z
      .array(
        z.object({
          question: z.string().trim().min(1, "Add the question").max(200),
          answer: z.string().trim().min(1, "Add the answer").max(1000),
        }),
      )
      .min(1, "Add at least one question")
      .max(20),
  }),
  newsletter: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    text: optionalText(200),
    buttonText: z.string().trim().min(1).max(30),
  }),
} as const;

export type SectionType = keyof typeof sectionSchemas;
export type SectionData<T extends SectionType> = z.infer<(typeof sectionSchemas)[T]>;

export const SECTION_TYPES = Object.keys(sectionSchemas) as SectionType[];

export const isSectionType = (value: string): value is SectionType =>
  value in sectionSchemas;

// Deal end date default: 30 days from now, as a datetime-local value
const inThirtyDays = () => {
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
};

export const SECTION_DEFAULTS: { [T in SectionType]: () => SectionData<T> } = {
  hero: () => ({
    heading: "Leather goods made to last",
    subheading: "Wallets, bags and belts cut and stitched for everyday use.",
    imageUrl: "",
    ctaText: "Shop now",
    ctaUrl: "/search",
    align: "left",
  }),
  featured_carousel: () => ({ title: "" }),
  newest_products: () => ({ title: "Newest Arrivals", count: 4 }),
  category_grid: () => ({ title: "Shop by category", subtitle: "" }),
  deal: () => ({
    title: "Deals of the Month",
    description: "Limited-time prices on selected pieces.",
    endsAt: inThirtyDays(),
    imageUrl: "/images/promo.jpg",
    ctaText: "View products",
    ctaUrl: "/search",
  }),
  features: () => ({
    title: "",
    items: [
      { icon: "Truck", title: "Nationwide shipping", text: "Delivered anywhere in the Philippines" },
      { icon: "RotateCcw", title: "Easy returns", text: "Returns within the return period" },
      { icon: "WalletCards", title: "Flexible payment", text: "GCash, Maya, cards or cash on delivery" },
      { icon: "Headset", title: "Customer support", text: "Get help when you need it" },
    ],
  }),
  story: () => ({
    title: "Our story",
    body: "Tell customers who you are, where your leather comes from and how each piece is made.",
    imageUrl: "",
    imageSide: "right",
    ctaText: "",
    ctaUrl: "",
  }),
  testimonials: () => ({
    title: "What customers say",
    items: [{ quote: "Replace this with a real customer review.", name: "Customer name", location: "City" }],
  }),
  faq: () => ({
    title: "Frequently asked questions",
    items: [
      { question: "How long does shipping take?", answer: "Replace this with your delivery times." },
      { question: "Can I pay cash on delivery?", answer: "Yes, choose Cash on Delivery at checkout." },
    ],
  }),
  newsletter: () => ({
    title: "Get new arrivals first",
    text: "New pieces and member deals, a few times a month.",
    buttonText: "Subscribe",
  }),
};

export const SECTION_LABELS: Record<SectionType, { name: string; hint: string }> = {
  hero: { name: "Hero banner", hint: "Big headline and button at the top" },
  featured_carousel: { name: "Featured carousel", hint: "Products marked Featured with a banner" },
  newest_products: { name: "Newest products", hint: "Your latest products" },
  category_grid: { name: "Shop by category", hint: "Links to each category" },
  deal: { name: "Deal countdown", hint: "Promotion with a timer" },
  features: { name: "Why shop with us", hint: "Icons with short selling points" },
  story: { name: "Brand story", hint: "Image and text about your shop" },
  testimonials: { name: "Testimonials", hint: "Quotes from customers" },
  faq: { name: "FAQ", hint: "Common questions and answers" },
  newsletter: { name: "Newsletter sign-up", hint: "Collect customer emails" },
};

// ---------------------------------------------------------------- editor fields

export type FieldDef =
  | { key: string; label: string; type: "text" | "url" | "textarea" | "image" | "datetime"; help?: string; max?: number }
  | { key: string; label: string; type: "number"; min: number; max: number; help?: string }
  | { key: string; label: string; type: "select"; options: readonly { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "list"; itemLabel: string; fields: FieldDef[]; help?: string };

const iconOptions = FEATURE_ICONS.map((icon) => ({ value: icon, label: icon }));

export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: [
    { key: "heading", label: "Heading", type: "text", max: 100 },
    { key: "subheading", label: "Subheading", type: "textarea", max: 240 },
    { key: "imageUrl", label: "Background image", type: "image", help: "Wide photo, at least 1600px across. Leave empty for a plain banner." },
    { key: "ctaText", label: "Button text", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link", type: "url", help: "A page like /search or a full link" },
    { key: "align", label: "Text alignment", type: "select", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }] },
  ],
  featured_carousel: [
    { key: "title", label: "Title (optional)", type: "text", max: 80, help: "Shows products marked Featured that have a banner image." },
  ],
  newest_products: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "count", label: "How many products", type: "number", min: 4, max: 12 },
  ],
  category_grid: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "subtitle", label: "Subtitle", type: "text", max: 160 },
  ],
  deal: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "description", label: "Description", type: "textarea", max: 300 },
    { key: "endsAt", label: "Ends at (Philippine time)", type: "datetime" },
    { key: "imageUrl", label: "Image", type: "image" },
    { key: "ctaText", label: "Button text", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link", type: "url" },
  ],
  features: [
    { key: "title", label: "Title (optional)", type: "text", max: 80 },
    {
      key: "items",
      label: "Items",
      type: "list",
      itemLabel: "Item",
      fields: [
        { key: "icon", label: "Icon", type: "select", options: iconOptions },
        { key: "title", label: "Title", type: "text", max: 60 },
        { key: "text", label: "Text", type: "text", max: 160 },
      ],
    },
  ],
  story: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "body", label: "Story", type: "textarea", max: 2000, help: "Blank lines start new paragraphs." },
    { key: "imageUrl", label: "Image", type: "image" },
    { key: "imageSide", label: "Image position", type: "select", options: [{ value: "right", label: "Right" }, { value: "left", label: "Left" }] },
    { key: "ctaText", label: "Button text (optional)", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link", type: "url" },
  ],
  testimonials: [
    { key: "title", label: "Title", type: "text", max: 80 },
    {
      key: "items",
      label: "Testimonials",
      type: "list",
      itemLabel: "Testimonial",
      fields: [
        { key: "quote", label: "Quote", type: "textarea", max: 400 },
        { key: "name", label: "Name", type: "text", max: 60 },
        { key: "location", label: "Location (optional)", type: "text", max: 60 },
      ],
    },
  ],
  faq: [
    { key: "title", label: "Title", type: "text", max: 80 },
    {
      key: "items",
      label: "Questions",
      type: "list",
      itemLabel: "Question",
      fields: [
        { key: "question", label: "Question", type: "text", max: 200 },
        { key: "answer", label: "Answer", type: "textarea", max: 1000 },
      ],
    },
  ],
  newsletter: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "text", label: "Text", type: "text", max: 200 },
    { key: "buttonText", label: "Button text", type: "text", max: 30 },
  ],
};

// Settings editor groups, one per Studio page
export const SETTINGS_FIELDS = {
  branding: [
    { key: "siteName", label: "Site name", type: "text", max: 60, help: "Shown in the header, browser tab and emails." },
    { key: "tagline", label: "Tagline", type: "text", max: 120 },
    { key: "logoUrl", label: "Logo", type: "image", help: "Square image works best. Leave empty to use the default logo." },
    { key: "contact.email", label: "Contact email", type: "text", max: 120 },
    { key: "contact.phone", label: "Contact phone", type: "text", max: 40 },
    { key: "contact.address", label: "Address", type: "textarea", max: 200 },
    { key: "social.facebook", label: "Facebook page", type: "url" },
    { key: "social.instagram", label: "Instagram", type: "url" },
    { key: "social.tiktok", label: "TikTok", type: "url" },
    { key: "social.shopee", label: "Shopee shop", type: "url" },
    { key: "social.lazada", label: "Lazada shop", type: "url" },
  ],
  announcement: [
    { key: "announcement.enabled", label: "Show the announcement bar", type: "select", options: [{ value: "true", label: "Shown" }, { value: "false", label: "Hidden" }] },
    { key: "announcement.text", label: "Message", type: "text", max: 140 },
    { key: "announcement.linkText", label: "Link text (optional)", type: "text", max: 40 },
    { key: "announcement.linkUrl", label: "Link", type: "url" },
  ],
  footer: [
    { key: "footer.about", label: "Footer blurb", type: "textarea", max: 300 },
    { key: "footer.copyright", label: "Copyright line", type: "text", max: 120, help: "Leave empty for “© year Site name. All rights reserved.”" },
    { key: "description", label: "Default search description", type: "textarea", max: 300, help: "Used by search engines for pages without their own description." },
    { key: "ogImageUrl", label: "Default share image", type: "image", help: "Shown when links are shared on Facebook or Messenger. 1200×630 works best." },
  ],
} satisfies Record<string, FieldDef[]>;

// ---------------------------------------------------------------- pages

export const RESERVED_PAGE_SLUGS = ["new"];

export const pageSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, like shipping-policy")
    .max(80)
    .refine((value) => !RESERVED_PAGE_SLUGS.includes(value), "That address is reserved"),
  content: z.string().max(50000),
  description: optionalText(300),
  published: z.boolean(),
  showInFooter: z.boolean(),
});

export type PageInput = z.infer<typeof pageSchema>;

// ---------------------------------------------------------------- theme

// Readable text color for a background, by WCAG relative luminance
export function contrastText(hex: string) {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  // Contrast with white vs. black; pick the stronger
  return (1.05 / (luminance + 0.05)) >= ((luminance + 0.05) / 0.05) ? "#FFFFFF" : "#111111";
}

export const radiusRem = (radius: SiteSettings["theme"]["radius"]) =>
  RADIUS_OPTIONS.find((option) => option.value === radius)?.rem ?? "0.625rem";
