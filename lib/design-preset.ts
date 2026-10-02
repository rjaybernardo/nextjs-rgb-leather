import type { SectionData, SectionType, SiteSettings } from "@/lib/site-config";

/*
 * The RGB Leathercrafts storefront layout, ready to edit in Site Studio.
 * Wording follows the design, in pesos and for customers in the Philippines.
 * Photos are left empty so the drawings show until real ones are uploaded.
 */

type PresetSection = { [T in SectionType]: { type: T; data: SectionData<T> } }[SectionType];

export const DESIGN_SECTIONS: PresetSection[] = [
  {
    type: "hero",
    data: {
      heading: "Made by hand. *Built to be handed down.*",
      subheading:
        "Full-grain, vegetable-tanned leather, saddle-stitched one piece at a time. It darkens with use and we repair it free for life.",
      imageUrl: "",
      ctaText: "Shop bestsellers",
      ctaUrl: "/search",
      secondaryCtaText: "Design your own",
      secondaryCtaUrl: "/#custom",
      layout: "split",
      showRating: "yes",
      trustPoints: [{ text: "Lifetime repairs" }, { text: "30-day free returns" }],
      callouts: [
        { text: "Hand saddle-stitched, 8 per inch", position: "top-left" },
        { text: "Italian veg-tan, 1.2 mm", position: "middle-right" },
        { text: "Edges burnished by hand", position: "bottom-left" },
      ],
      caption: "The Bifold, Cognac",
    },
  },
  {
    type: "features",
    data: {
      title: "",
      style: "strip",
      items: [
        { icon: "Truck", title: "Ships in 48 hours", text: "Free shipping over ₱3,000" },
        { icon: "Wrench", title: "Free repairs for life", text: "Restitch, re-edge, recondition" },
        { icon: "RotateCcw", title: "30-day returns", text: "Even if it's been used" },
        { icon: "Stamp", title: "Free monogram", text: "Up to 3 letters, heat-stamped" },
      ],
    },
  },
  {
    type: "product_tabs",
    data: { title: "What do you *carry?*", count: 4, showAllTab: "no" },
  },
  {
    type: "craft",
    data: {
      title: "What goes into *one card sleeve*",
      intro: "Four hours of handwork, start to finish. Here is where the time goes.",
      imageUrl: "",
      points: [
        {
          title: "Full-grain, vegetable-tanned hide.",
          text: "Tanned slowly with tree bark, so it darkens instead of cracking.",
        },
        {
          title: "Saddle stitch, 8 stitches per inch.",
          text: "Two needles, waxed linen. If one thread breaks, the seam holds.",
        },
        {
          title: "Edges sanded, dyed and burnished.",
          text: "Three coats, polished by hand until they shine like glass.",
        },
        {
          title: "Cut with a 0.5 mm tolerance.",
          text: "Holds four to six cards snug on day one, and still holds them in year ten.",
        },
      ],
      comparisonTitle: "How it compares to a typical mall wallet",
      ourLabel: "RGB Leathercrafts",
      theirLabel: "Typical mall wallet",
      rows: [
        { label: "Leather", ours: "Full-grain, vegetable-tanned", theirs: "Corrected or bonded, chrome-tanned" },
        { label: "Stitching", ours: "Hand saddle-stitch that won't unravel", theirs: "Machine lockstitch that unzips once cut" },
        { label: "Edges", ours: "Burnished by hand", theirs: "Painted, cracks within a year" },
        { label: "With age", ours: "Darkens into a patina", theirs: "Peels and frays" },
        { label: "Repairs", ours: "Free, for life", theirs: "Replace it" },
      ],
    },
  },
  {
    type: "testimonials",
    data: {
      title: "Reviewed after *years,* not days.",
      showSummary: "yes",
      items: [
        {
          quote: "Three years in my back pocket. It's darker, softer, and somehow looks better than the day it arrived.",
          name: "Miguel S.",
          location: "Quezon City",
          product: "Bifold, Cognac",
        },
        {
          quote: "A strap came loose after two years of daily commuting. Sent it in, got it back restitched in a week. Didn't pay a thing.",
          name: "Andrea L.",
          location: "Makati",
          product: "Field Tote, Black",
        },
        {
          quote: "Bought it as a wedding gift with our initials stamped inside. The box alone made my wife cry.",
          name: "Paolo R.",
          location: "Cebu City",
          product: "Everyday Set, Oxblood",
        },
      ],
    },
  },
  {
    type: "spotlight",
    data: {
      badge: "Save ₱1,500",
      title: "The Everyday Set",
      text: "Bifold wallet, card sleeve and key loop, cut from the same hide so they age together. Comes in a gift box with a care card.",
      bullets: [
        { text: "Free monogram on all three pieces" },
        { text: "Gift box and handwritten note included" },
        { text: "Available in Cognac, Oxblood and Black" },
      ],
      imageUrl: "",
      productSlug: "",
      compareAtPrice: "",
      ctaText: "Shop the set",
      ctaUrl: "/search",
    },
  },
  {
    type: "steps",
    data: {
      title: "Made to order, *made for you.*",
      intro: "Pick the leather, thread and initials. We cut and stitch it for you alone and ship within 10 working days.",
      steps: [
        { title: "Choose a piece", text: "Start from any wallet, bag or accessory in the shop." },
        { title: "Pick leather and thread", text: "Cognac, Oxblood, Black, Natural or Olive, with matching or contrast thread." },
        { title: "Add your initials", text: "Up to three letters, heat-stamped or hand-tooled." },
        { title: "We make it", text: "Photos from the bench while it's made. Ships in 10 working days." },
      ],
      ctaText: "Start your design",
      ctaUrl: "/search",
    },
  },
  {
    type: "gallery",
    data: {
      title: "Carried for years",
      linkText: "Share yours with #CarriedByRGB",
      linkUrl: "",
      images: [
        { imageUrl: "", caption: "4 years" },
        { imageUrl: "", caption: "2 years" },
        { imageUrl: "", caption: "6 months" },
        { imageUrl: "", caption: "5 years" },
        { imageUrl: "", caption: "1 year" },
        { imageUrl: "", caption: "3 years" },
      ],
    },
  },
  {
    type: "faq",
    data: {
      title: "Questions, *answered.*",
      intro: "Can't find what you need? Message us and a real person from the workshop replies within a day.",
      ctaText: "Message the workshop",
      ctaUrl: "/pages/contact",
      items: [
        {
          question: "How does vegetable-tanned leather age?",
          answer:
            "It darkens and softens with sunlight and handling. Light tones like Natural change the most; Black changes the least. Scratches buff out with your thumb.",
        },
        {
          question: "What does the lifetime repair cover?",
          answer:
            "Restitching, edge refinishing, hardware replacement and reconditioning, for as long as you own the piece. You cover shipping to us; we cover the rest.",
        },
        {
          question: "Can I return something I've used?",
          answer:
            "Yes. Carry it for up to 30 days. If it isn't right, send it back for a full refund. Monogrammed and made-to-order pieces are exchange only.",
        },
        {
          question: "How long does shipping take?",
          answer:
            "In-stock pieces ship within 48 hours: 1–3 days in Metro Manila, 3–7 days to the provinces. Made-to-order pieces ship within 10 working days. You'll get tracking by email.",
        },
        {
          question: "How can I pay?",
          answer: "GCash, Maya, credit or debit card, QR Ph, or cash on delivery.",
        },
        {
          question: "How do I care for it?",
          answer:
            "Wipe with a dry cloth. Condition every six months with the balm included in your box. Keep it away from long soaks.",
        },
      ],
    },
  },
];

// Settings the layout is designed around; other settings are left as they are
export const DESIGN_SETTINGS = {
  theme: { primaryColor: "#43191A", font: "schibsted", radius: "md" },
  announcement: {
    enabled: true,
    text: "Free shipping on orders over ₱3,000",
    secondaryText: "Free monogramming this month",
  },
} satisfies { theme: Partial<SiteSettings["theme"]>; announcement: Partial<SiteSettings["announcement"]> };
