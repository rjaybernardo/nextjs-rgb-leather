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
  { value: "schibsted", label: "Schibsted Grotesk (bold, editorial)" },
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

// The accent: dark sections, badges and highlights
export const THEME_PRESETS = [
  { name: "Burgundy", color: "#43191A" },
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
        "schibsted",
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
    secondaryText: optionalText(140),
    linkText: optionalText(40),
    linkUrl: link,
  }),

  footer: z.object({
    about: optionalText(300),
    copyright: optionalText(120),
    newsletterTitle: optionalText(100),
    newsletterText: optionalText(200),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: process.env.NEXT_PUBLIC_APP_NAME || "Your Store",
  tagline: "Your tagline goes here",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Shop online and pay with GCash, Maya, card or cash on delivery.",
  logoUrl: "",
  ogImageUrl: "",
  contact: { email: "", phone: "", address: "" },
  social: { facebook: "", instagram: "", tiktok: "", shopee: "", lazada: "" },
  theme: {
    primaryColor: "#43191A",
    radius: "md",
    font: "schibsted",
    defaultMode: "light",
  },
  announcement: {
    enabled: true,
    text: "Your announcement goes here",
    secondaryText: "",
    linkText: "Shop now",
    linkUrl: "/search",
  },
  footer: {
    about: "A short line about your store goes here.",
    copyright: "",
    newsletterTitle: "Join our *newsletter.*",
    newsletterText: "New arrivals and member deals, straight to your inbox.",
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
  "Wrench",
  "Stamp",
  "Scissors",
  "Ruler",
  "Package",
  "Clock",
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

// Grid or a sideways-scrolling carousel, for sections with a row of cards
const cardLayout = z.enum(["grid", "carousel"]);

const featureItem = z.object({
  icon: z.enum(FEATURE_ICONS),
  title: z.string().trim().min(1, "Add a title").max(60),
  text: optionalText(160),
});

export const sectionSchemas = {
  hero: z.object({
    heading: z.string().trim().min(1, "Add a heading").max(120),
    subheading: optionalText(240),
    imageUrl: imageLink,
    ctaText: optionalText(40),
    ctaUrl: link,
    secondaryCtaText: optionalText(40),
    secondaryCtaUrl: link,
    layout: z.enum(["split", "overlay"]),
    showRating: z.enum(["yes", "no"]),
    trustPoints: z.array(z.object({ text: z.string().trim().min(1).max(40) })).max(4),
    callouts: z
      .array(
        z.object({
          text: z.string().trim().min(1, "Add the callout text").max(50),
          position: z.enum(["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]),
        }),
      )
      .max(4),
    caption: optionalText(80),
    // More slides make the banner a carousel; the fields above are slide 1
    slides: z
      .array(
        z.object({
          heading: z.string().trim().min(1, "Add a heading").max(120),
          subheading: optionalText(240),
          imageUrl: imageLink,
          ctaText: optionalText(40),
          ctaUrl: link,
        }),
      )
      .max(4),
    autoplay: z.enum(["yes", "no"]),
  }),
  featured_carousel: z.object({
    title: optionalText(80),
  }),
  newest_products: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    count: z.coerce.number().int().min(4).max(12),
    layout: cardLayout,
  }),
  category_grid: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    subtitle: optionalText(160),
    layout: cardLayout,
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
    style: z.enum(["strip", "cards"]),
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
    showSummary: z.enum(["yes", "no"]),
    layout: cardLayout,
    items: z
      .array(
        z.object({
          quote: z.string().trim().min(1, "Add the quote").max(400),
          name: z.string().trim().min(1, "Add a name").max(60),
          location: optionalText(60),
          product: optionalText(60),
        }),
      )
      .min(1, "Add at least one testimonial")
      .max(12),
  }),
  faq: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    intro: optionalText(200),
    ctaText: optionalText(40),
    ctaUrl: link,
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
  product_tabs: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    count: z.coerce.number().int().min(4).max(12),
    showAllTab: z.enum(["yes", "no"]),
  }),
  craft: z.object({
    title: z.string().trim().min(1, "Add a title").max(100),
    intro: optionalText(240),
    imageUrl: imageLink,
    points: z
      .array(z.object({ title: z.string().trim().min(1).max(80), text: optionalText(200) }))
      .max(6),
    comparisonTitle: optionalText(100),
    ourLabel: optionalText(40),
    theirLabel: optionalText(40),
    rows: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(40),
          ours: z.string().trim().min(1).max(80),
          theirs: z.string().trim().min(1).max(80),
        }),
      )
      .max(8),
  }),
  spotlight: z.object({
    badge: optionalText(30),
    title: z.string().trim().min(1, "Add a title").max(80),
    text: optionalText(300),
    bullets: z.array(z.object({ text: z.string().trim().min(1).max(80) })).max(5),
    imageUrl: imageLink,
    productSlug: z
      .string()
      .trim()
      .max(120)
      .refine((value) => value === "" || /^[a-z0-9-]+$/.test(value), "Use the product's address, like classic-tote"),
    compareAtPrice: optionalText(20).refine(
      (value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value),
      "Enter an amount like 4500",
    ),
    ctaText: optionalText(40),
    ctaUrl: link,
  }),
  steps: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    intro: optionalText(240),
    steps: z
      .array(z.object({ title: z.string().trim().min(1).max(60), text: optionalText(200) }))
      .min(1, "Add at least one step")
      .max(6),
    ctaText: optionalText(40),
    ctaUrl: link,
  }),
  gallery: z.object({
    title: z.string().trim().min(1, "Add a title").max(80),
    linkText: optionalText(60),
    linkUrl: link,
    layout: cardLayout,
    images: z
      .array(z.object({ imageUrl: imageLink, caption: optionalText(40) }))
      .max(12),
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
    heading: "Your headline goes here. *Make it memorable.*",
    subheading: "One or two sentences on what you sell and why customers love it.",
    imageUrl: "",
    ctaText: "Shop now",
    ctaUrl: "/search",
    secondaryCtaText: "",
    secondaryCtaUrl: "",
    layout: "split",
    showRating: "yes",
    trustPoints: [],
    callouts: [],
    caption: "",
    slides: [],
    autoplay: "yes",
  }),
  featured_carousel: () => ({ title: "" }),
  newest_products: () => ({ title: "Newest Arrivals", count: 4, layout: "grid" }),
  category_grid: () => ({ title: "Shop by category", subtitle: "", layout: "grid" }),
  deal: () => ({
    title: "Deals of the Month",
    description: "Limited-time prices on selected products.",
    endsAt: inThirtyDays(),
    imageUrl: "",
    ctaText: "View products",
    ctaUrl: "/search",
  }),
  features: () => ({
    title: "",
    style: "strip",
    items: [
      { icon: "Truck", title: "Nationwide shipping", text: "Delivered anywhere in the Philippines" },
      { icon: "RotateCcw", title: "Easy returns", text: "Returns within the return period" },
      { icon: "WalletCards", title: "Flexible payment", text: "GCash, Maya, cards or cash on delivery" },
      { icon: "Headset", title: "Customer support", text: "Get help when you need it" },
    ],
  }),
  story: () => ({
    title: "Our story",
    body: "Tell customers who you are, what you make or sell, and what makes your store different.",
    imageUrl: "",
    imageSide: "right",
    ctaText: "",
    ctaUrl: "",
  }),
  testimonials: () => ({
    title: "What customers say",
    showSummary: "yes",
    layout: "grid",
    items: [{ quote: "Replace this with a real customer review.", name: "Customer name", location: "City", product: "" }],
  }),
  faq: () => ({
    title: "Frequently asked questions",
    intro: "",
    ctaText: "",
    ctaUrl: "",
    items: [
      { question: "How long does shipping take?", answer: "Replace this with your delivery times." },
      { question: "Can I pay cash on delivery?", answer: "Yes, choose Cash on Delivery at checkout." },
    ],
  }),
  newsletter: () => ({
    title: "Get new arrivals first",
    text: "New arrivals and member deals, a few times a month.",
    buttonText: "Subscribe",
  }),
  product_tabs: () => ({ title: "Shop by *category*", count: 4, showAllTab: "no" }),
  craft: () => ({
    title: "What goes into *every product*",
    intro: "A short intro on how your products are made or sourced.",
    imageUrl: "",
    points: [
      { title: "First quality point.", text: "Explain the material, process or detail that sets you apart." },
      { title: "Second quality point.", text: "Keep each point to one or two sentences." },
    ],
    comparisonTitle: "",
    ourLabel: "",
    theirLabel: "",
    rows: [],
  }),
  spotlight: () => ({
    badge: "",
    title: "Featured product",
    text: "Tell customers why this one is worth it.",
    bullets: [],
    imageUrl: "",
    productSlug: "",
    compareAtPrice: "",
    ctaText: "View it",
    ctaUrl: "/search",
  }),
  steps: () => ({
    title: "How it *works*",
    intro: "",
    steps: [
      { title: "Step one", text: "Describe the first step." },
      { title: "Step two", text: "Describe the second step." },
      { title: "Step three", text: "Describe the last step." },
    ],
    ctaText: "",
    ctaUrl: "",
  }),
  gallery: () => ({
    title: "Photo gallery",
    linkText: "",
    linkUrl: "",
    layout: "grid",
    images: [
      { imageUrl: "", caption: "" },
      { imageUrl: "", caption: "" },
      { imageUrl: "", caption: "" },
    ],
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
  product_tabs: { name: "Shop by category tabs", hint: "Product grid with a tab per category" },
  craft: { name: "Details and comparison", hint: "How it's made or sourced, with an optional comparison table" },
  spotlight: { name: "Product spotlight", hint: "Feature one product or set" },
  steps: { name: "Steps", hint: "Numbered steps, like made to order" },
  gallery: { name: "Photo gallery", hint: "A row of photos with captions" },
};

// ---------------------------------------------------------------- editor fields

export type FieldDef =
  | { key: string; label: string; type: "text" | "url" | "textarea" | "image" | "datetime"; help?: string; max?: number }
  | { key: string; label: string; type: "number"; min: number; max: number; help?: string }
  | { key: string; label: string; type: "select"; options: readonly { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "list"; itemLabel: string; fields: FieldDef[]; help?: string };

const iconOptions = FEATURE_ICONS.map((icon) => ({ value: icon, label: icon }));

const ACCENT_HELP = "Wrap words in *asterisks* for the italic accent.";

const layoutField = (help: string): FieldDef => ({
  key: "layout",
  label: "Layout",
  type: "select",
  options: [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel (swipe sideways)" },
  ],
  help,
});

const CALLOUT_POSITIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "middle-left", label: "Middle left" },
  { value: "middle-right", label: "Middle right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
] as const;

export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: [
    { key: "heading", label: "Heading", type: "text", max: 120, help: ACCENT_HELP },
    { key: "subheading", label: "Subheading", type: "textarea", max: 240 },
    { key: "layout", label: "Layout", type: "select", options: [{ value: "split", label: "Text beside the photo" }, { value: "overlay", label: "Text over the photo" }] },
    { key: "imageUrl", label: "Photo", type: "image", help: "A product or lifestyle photo. Square-ish for “beside”, wide for “over”." },
    { key: "ctaText", label: "Main button text", type: "text", max: 40 },
    { key: "ctaUrl", label: "Main button link", type: "url", help: "A page like /search or a full link" },
    { key: "secondaryCtaText", label: "Second button text (optional)", type: "text", max: 40 },
    { key: "secondaryCtaUrl", label: "Second button link", type: "url" },
    { key: "showRating", label: "Star rating from your reviews", type: "select", options: [{ value: "yes", label: "Shown" }, { value: "no", label: "Hidden" }] },
    {
      key: "trustPoints",
      label: "Trust points",
      type: "list",
      itemLabel: "Point",
      fields: [{ key: "text", label: "Text", type: "text", max: 40 }],
    },
    {
      key: "callouts",
      label: "Photo callouts",
      type: "list",
      itemLabel: "Callout",
      fields: [
        { key: "text", label: "Text", type: "text", max: 50 },
        { key: "position", label: "Position", type: "select", options: CALLOUT_POSITIONS },
      ],
    },
    { key: "caption", label: "Photo caption (optional)", type: "text", max: 80 },
    {
      key: "slides",
      label: "More slides (makes the banner a carousel)",
      type: "list",
      itemLabel: "Slide",
      help: "The fields above are the first slide. Add up to 4 more; each has its own photo, heading and button.",
      fields: [
        { key: "heading", label: "Heading", type: "text", max: 120, help: ACCENT_HELP },
        { key: "subheading", label: "Subheading", type: "textarea", max: 240 },
        { key: "imageUrl", label: "Photo", type: "image" },
        { key: "ctaText", label: "Button text", type: "text", max: 40 },
        { key: "ctaUrl", label: "Button link", type: "url" },
      ],
    },
    { key: "autoplay", label: "Change slides automatically", type: "select", options: [{ value: "yes", label: "Yes, every 6 seconds" }, { value: "no", label: "No, customers use the arrows" }], help: "Pauses while the mouse is over the banner, and for visitors who turn off animations." },
  ],
  featured_carousel: [
    { key: "title", label: "Title (optional)", type: "text", max: 80, help: "Shows products marked Featured that have a banner image." },
  ],
  newest_products: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "count", label: "How many products", type: "number", min: 4, max: 12 },
    layoutField("A carousel fits more products in less space; set a higher count to use it."),
  ],
  category_grid: [
    { key: "title", label: "Title", type: "text", max: 80 },
    { key: "subtitle", label: "Subtitle", type: "text", max: 160 },
    layoutField("Use a carousel when you have more than four categories."),
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
    { key: "style", label: "Style", type: "select", options: [{ value: "strip", label: "Strip across the page" }, { value: "cards", label: "Card" }] },
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
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "showSummary", label: "Rating summary from your reviews", type: "select", options: [{ value: "yes", label: "Shown" }, { value: "no", label: "Hidden" }] },
    layoutField("A carousel suits more than three testimonials."),
    {
      key: "items",
      label: "Testimonials",
      type: "list",
      itemLabel: "Testimonial",
      fields: [
        { key: "quote", label: "Quote", type: "textarea", max: 400 },
        { key: "name", label: "Name", type: "text", max: 60 },
        { key: "location", label: "Location (optional)", type: "text", max: 60 },
        { key: "product", label: "Product (optional)", type: "text", max: 60 },
      ],
    },
  ],
  faq: [
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "intro", label: "Intro (optional)", type: "textarea", max: 200 },
    { key: "ctaText", label: "Button text (optional)", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link", type: "url" },
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
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "text", label: "Text", type: "text", max: 200 },
    { key: "buttonText", label: "Button text", type: "text", max: 30 },
  ],
  product_tabs: [
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "count", label: "Products per tab", type: "number", min: 4, max: 12 },
    { key: "showAllTab", label: "“All” tab first", type: "select", options: [{ value: "yes", label: "Shown" }, { value: "no", label: "Hidden" }] },
  ],
  craft: [
    { key: "title", label: "Title", type: "text", max: 100, help: ACCENT_HELP },
    { key: "intro", label: "Intro", type: "textarea", max: 240 },
    { key: "imageUrl", label: "Photo", type: "image", help: "Numbered markers on the photo match the points below." },
    {
      key: "points",
      label: "Points",
      type: "list",
      itemLabel: "Point",
      fields: [
        { key: "title", label: "Title", type: "text", max: 80 },
        { key: "text", label: "Text", type: "text", max: 200 },
      ],
    },
    { key: "comparisonTitle", label: "Comparison title (optional)", type: "text", max: 100 },
    { key: "ourLabel", label: "Your column heading", type: "text", max: 40 },
    { key: "theirLabel", label: "Other column heading", type: "text", max: 40 },
    {
      key: "rows",
      label: "Comparison rows",
      type: "list",
      itemLabel: "Row",
      fields: [
        { key: "label", label: "Row label", type: "text", max: 40 },
        { key: "ours", label: "Yours", type: "text", max: 80 },
        { key: "theirs", label: "Theirs", type: "text", max: 80 },
      ],
    },
  ],
  spotlight: [
    { key: "badge", label: "Badge (optional)", type: "text", max: 30, help: "e.g. Save ₱500" },
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "text", label: "Text", type: "textarea", max: 300 },
    {
      key: "bullets",
      label: "Bullet points",
      type: "list",
      itemLabel: "Bullet",
      fields: [{ key: "text", label: "Text", type: "text", max: 80 }],
    },
    { key: "imageUrl", label: "Photo", type: "image", help: "Leave empty to use the product's photo." },
    { key: "productSlug", label: "Product address (optional)", type: "text", max: 120, help: "The end of its link, e.g. classic-tote. Shows its price and links to it." },
    { key: "compareAtPrice", label: "Compare-at price (₱, optional)", type: "text", max: 20, help: "Shown struck through next to the price." },
    { key: "ctaText", label: "Button text", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link (if no product)", type: "url" },
  ],
  steps: [
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "intro", label: "Intro (optional)", type: "textarea", max: 240 },
    {
      key: "steps",
      label: "Steps",
      type: "list",
      itemLabel: "Step",
      fields: [
        { key: "title", label: "Title", type: "text", max: 60 },
        { key: "text", label: "Text", type: "text", max: 200 },
      ],
    },
    { key: "ctaText", label: "Button text (optional)", type: "text", max: 40 },
    { key: "ctaUrl", label: "Button link", type: "url" },
  ],
  gallery: [
    { key: "title", label: "Title", type: "text", max: 80, help: ACCENT_HELP },
    { key: "linkText", label: "Link text (optional)", type: "text", max: 60, help: "e.g. Share yours with #YourBrand" },
    { key: "linkUrl", label: "Link", type: "url" },
    layoutField("A carousel shows the photos as a swipeable strip."),
    {
      key: "images",
      label: "Photos",
      type: "list",
      itemLabel: "Photo",
      fields: [
        { key: "imageUrl", label: "Photo", type: "image" },
        { key: "caption", label: "Caption (optional)", type: "text", max: 40 },
      ],
    },
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
    { key: "announcement.secondaryText", label: "Second message (optional, hidden on phones)", type: "text", max: 140 },
    { key: "announcement.linkText", label: "Link text (optional)", type: "text", max: 40 },
    { key: "announcement.linkUrl", label: "Link", type: "url" },
  ],
  footer: [
    { key: "footer.newsletterTitle", label: "Newsletter heading", type: "text", max: 100, help: "Wrap words in *asterisks* for the italic accent." },
    { key: "footer.newsletterText", label: "Newsletter text", type: "textarea", max: 200 },
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
