import type { SectionData, SectionType, SiteSettings } from "@/lib/site-config";

/*
 * The starter storefront layout, ready to edit in Site Studio. Every brand
 * fills in its own wording and photos; the text below is placeholder copy
 * that says what belongs in each spot. Photos are left empty so image
 * placeholders show until real ones are uploaded. Prices are in pesos, for
 * customers in the Philippines.
 */

type PresetSection = { [T in SectionType]: { type: T; data: SectionData<T> } }[SectionType];

export const DESIGN_SECTIONS: PresetSection[] = [
  {
    type: "hero",
    data: {
      heading: "Your headline goes here. *Make it memorable.*",
      subheading:
        "One or two sentences on what you sell and why customers love it. Keep it short and specific.",
      imageUrl: "",
      ctaText: "Shop now",
      ctaUrl: "/search",
      secondaryCtaText: "Learn more",
      secondaryCtaUrl: "/#how-it-works",
      layout: "split",
      showRating: "yes",
      trustPoints: [{ text: "Trust point one" }, { text: "Trust point two" }],
      callouts: [
        { text: "Product detail one", position: "top-left" },
        { text: "Product detail two", position: "middle-right" },
        { text: "Product detail three", position: "bottom-left" },
      ],
      caption: "Product name, variant",
    },
  },
  {
    type: "features",
    data: {
      title: "",
      style: "strip",
      items: [
        { icon: "Truck", title: "Nationwide shipping", text: "Delivered anywhere in the Philippines" },
        { icon: "ShieldCheck", title: "Quality guarantee", text: "Describe your promise here" },
        { icon: "RotateCcw", title: "Easy returns", text: "Returns within the return period" },
        { icon: "WalletCards", title: "Flexible payment", text: "GCash, Maya, cards or cash on delivery" },
      ],
    },
  },
  {
    type: "product_tabs",
    data: { title: "Shop by *category*", count: 4, showAllTab: "no" },
  },
  {
    type: "craft",
    data: {
      title: "What goes into *every product*",
      intro: "A short intro on how your products are made or sourced, and why it matters.",
      imageUrl: "",
      points: [
        { title: "First quality point.", text: "Explain the material, process or detail that sets you apart." },
        { title: "Second quality point.", text: "Keep each point to one or two sentences." },
        { title: "Third quality point.", text: "Numbered markers on the photo match these points." },
        { title: "Fourth quality point.", text: "Remove any points you don't need." },
      ],
      comparisonTitle: "How we compare",
      ourLabel: "Us",
      theirLabel: "Typical alternative",
      rows: [
        { label: "Materials", ours: "What you use", theirs: "What others use" },
        { label: "Quality", ours: "Your standard", theirs: "The usual standard" },
        { label: "Durability", ours: "How long yours lasts", theirs: "How long theirs lasts" },
        { label: "Support", ours: "Your after-sales promise", theirs: "Typical after-sales" },
      ],
    },
  },
  {
    type: "testimonials",
    data: {
      title: "What our *customers* say",
      showSummary: "yes",
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
    type: "spotlight",
    data: {
      badge: "Badge text",
      title: "Featured product",
      text: "Describe the product or bundle you want to highlight and why it's worth buying.",
      bullets: [{ text: "Key benefit one" }, { text: "Key benefit two" }, { text: "Key benefit three" }],
      imageUrl: "",
      productSlug: "",
      compareAtPrice: "",
      ctaText: "Shop now",
      ctaUrl: "/search",
    },
  },
  {
    type: "steps",
    data: {
      title: "How it *works*",
      intro: "A short intro to the steps a customer follows, like ordering, customizing or booking.",
      steps: [
        { title: "Step one", text: "Describe the first step." },
        { title: "Step two", text: "Describe the second step." },
        { title: "Step three", text: "Describe the third step." },
        { title: "Step four", text: "Describe the last step." },
      ],
      ctaText: "Get started",
      ctaUrl: "/search",
    },
  },
  {
    type: "gallery",
    data: {
      title: "Photo gallery",
      linkText: "",
      linkUrl: "",
      images: [
        { imageUrl: "", caption: "Caption" },
        { imageUrl: "", caption: "Caption" },
        { imageUrl: "", caption: "Caption" },
        { imageUrl: "", caption: "Caption" },
        { imageUrl: "", caption: "Caption" },
        { imageUrl: "", caption: "Caption" },
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
        {
          question: "Add your own question",
          answer: "Add the answer here.",
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
