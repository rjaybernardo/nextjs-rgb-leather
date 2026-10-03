import { SECTION_DEFAULTS, type SectionData, type SectionType, type SiteSettings } from "@/lib/site-config";

/*
 * The starter storefront layout, ready to edit in Site Studio. Every brand
 * fills in its own wording and photos; the text below is placeholder copy
 * that says what belongs in each spot. Photos point at the sample images in
 * public/images until real ones are uploaded. Prices are in pesos, for
 * customers in the Philippines.
 *
 * Ordered to convert: a clear offer and button, trust, then products within
 * one scroll, a time-limited deal, social proof, and answers to objections.
 * Email sign-up is in the footer, so it isn't repeated here.
 */

type PresetSection = { [T in SectionType]: { type: T; data: SectionData<T> } }[SectionType];

// A function so the deal countdown ends 30 days from when it is applied
export const designSections = (): PresetSection[] => [
  {
    type: "hero",
    data: {
      heading: "Your headline goes here. *Make it memorable.*",
      subheading: "One or two sentences on what you sell and why customers love it.",
      imageUrl: "/images/banner-1.jpg",
      ctaText: "Shop now",
      ctaUrl: "/search",
      secondaryCtaText: "Browse categories",
      secondaryCtaUrl: "/#categories",
      layout: "overlay",
      showRating: "yes",
      trustPoints: [{ text: "Cash on delivery" }, { text: "Easy returns" }],
      callouts: [],
      caption: "",
      slides: [],
      autoplay: "yes",
    },
  },
  {
    type: "features",
    data: {
      title: "",
      style: "strip",
      items: [
        { icon: "Truck", title: "Nationwide shipping", text: "Delivered anywhere in the Philippines" },
        { icon: "WalletCards", title: "Flexible payment", text: "GCash, Maya, cards or cash on delivery" },
        { icon: "RotateCcw", title: "Easy returns", text: "Returns within the return period" },
        { icon: "ShieldCheck", title: "Quality guarantee", text: "Describe your promise here" },
      ],
    },
  },
  {
    type: "newest_products",
    data: { title: "New *arrivals*", count: 4, layout: "grid" },
  },
  {
    type: "category_grid",
    data: { title: "Shop by *category*", subtitle: "", layout: "grid" },
  },
  {
    type: "deal",
    data: {
      title: "Limited-time *deal*",
      description: "Describe your promotion here: what's on sale and by how much.",
      // Placeholder date; set the real end date in Site Studio
      endsAt: SECTION_DEFAULTS.deal().endsAt,
      imageUrl: "/images/promo.jpg",
      ctaText: "Shop the sale",
      ctaUrl: "/search",
    },
  },
  {
    type: "testimonials",
    data: {
      title: "Loved by *customers*",
      showSummary: "yes",
      layout: "grid",
      items: [
        {
          quote: "Replace this with a real review from a happy customer. Specific details make it believable.",
          name: "Customer name",
          location: "City",
          product: "Product purchased",
        },
        {
          quote: "A second customer review. Mention what they bought and what they liked about it.",
          name: "Customer name",
          location: "City",
          product: "Product purchased",
        },
        {
          quote: "A third customer review. Short quotes read best, two or three sentences at most.",
          name: "Customer name",
          location: "City",
          product: "Product purchased",
        },
      ],
    },
  },
  {
    type: "faq",
    data: {
      title: "Questions, *answered.*",
      intro: "Can't find what you need? Message us and we'll reply within a day.",
      ctaText: "Contact us",
      ctaUrl: "/pages/contact",
      items: [
        {
          question: "How long does shipping take?",
          answer: "Replace this with your delivery times, e.g. 1–3 days in Metro Manila and 3–7 days to the provinces.",
        },
        {
          question: "How can I pay?",
          answer: "GCash, Maya, credit or debit card, QR Ph, or cash on delivery.",
        },
        {
          question: "Can I return an item?",
          answer: "Replace this with your return policy.",
        },
      ],
    },
  },
];

// Settings the layout is designed around; other settings are left as they are
export const DESIGN_SETTINGS = {
  theme: { font: "schibsted", radius: "md" },
  announcement: {
    enabled: true,
    text: "Your announcement goes here",
    secondaryText: "",
  },
} satisfies { theme: Partial<SiteSettings["theme"]>; announcement: Partial<SiteSettings["announcement"]> };
