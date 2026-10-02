-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSON NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "data" JSON NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "showInFooter" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeSection_position_idx" ON "HomeSection"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- Seed: home sections matching the current home page; new ones start hidden
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('hero', 0, false, '{"heading": "Leather goods made to last", "subheading": "Wallets, bags and belts cut and stitched for everyday use.", "imageUrl": "", "ctaText": "Shop now", "ctaUrl": "/search", "align": "left"}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('featured_carousel', 1, true, '{"title": ""}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('newest_products', 2, true, '{"title": "Newest Arrivals", "count": 4}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('category_grid', 3, true, '{"title": "Shop by category", "subtitle": ""}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('deal', 4, true, '{"title": "Deals of the Month", "description": "Get ready for a shopping experience like never before with our Deals of the Month. Every purchase comes with exclusive perks and offers.", "endsAt": "2026-12-31T23:59", "imageUrl": "/images/promo.jpg", "ctaText": "View products", "ctaUrl": "/search"}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('features', 5, true, '{"title": "", "items": [{"icon": "Truck", "title": "Free Shipping", "text": "Free shipping for qualifying orders"}, {"icon": "RotateCcw", "title": "Money Back Guarantee", "text": "Easy returns within the return period"}, {"icon": "WalletCards", "title": "Flexible Payment", "text": "GCash, Maya, cards or cash on delivery"}, {"icon": "Headset", "title": "Customer Support", "text": "Get support when you need it"}]}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('story', 6, false, '{"title": "Our story", "body": "Tell customers who you are, where your leather comes from and how each piece is made.", "imageUrl": "", "imageSide": "right", "ctaText": "", "ctaUrl": ""}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('testimonials', 7, false, '{"title": "What customers say", "items": [{"quote": "Replace this with a real customer review.", "name": "Customer name", "location": "City"}]}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('faq', 8, false, '{"title": "Frequently asked questions", "items": [{"question": "How long does shipping take?", "answer": "Replace this with your delivery times."}, {"question": "Can I pay cash on delivery?", "answer": "Yes, choose Cash on Delivery at checkout."}]}'::json, CURRENT_TIMESTAMP);
INSERT INTO "HomeSection" ("type", "position", "enabled", "data", "updatedAt") VALUES ('newsletter', 9, false, '{"title": "Get new arrivals first", "text": "New pieces and member deals, a few times a month.", "buttonText": "Subscribe"}'::json, CURRENT_TIMESTAMP);

-- Seed: unpublished draft pages to fill in
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('about', 'About us', 'Who we are and how our leather goods are made.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## Who we are

[Your shop''s story: who started it, where you are based, what you make.]

## How we make our goods

[Materials, where your leather comes from, how each piece is made.]
', false, true, 0, CURRENT_TIMESTAMP);
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('contact', 'Contact us', 'How to reach us.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## Get in touch

- **Email:** [your email]
- **Phone / Viber:** [your number]
- **Hours:** [e.g. Monday to Saturday, 9 AM to 6 PM]

## Visit us

[Address, if customers can visit.]
', false, true, 1, CURRENT_TIMESTAMP);
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('shipping', 'Shipping policy', 'Delivery areas, fees and times.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## Where we ship

[e.g. Anywhere in the Philippines.]

## Fees

[Your shipping fee and free-shipping minimum. These should match Admin → Settings.]

## Delivery times

- Metro Manila: [x–y business days]
- Luzon: [x–y business days]
- Visayas and Mindanao: [x–y business days]

## Couriers and tracking

[Which couriers you use. Customers see their tracking number on their order page.]
', false, true, 2, CURRENT_TIMESTAMP);
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('returns', 'Returns and refunds', 'How returns, exchanges and refunds work.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## Return window

[e.g. Within 7 days of delivery.]

## Conditions

[Unused, with tags, original packaging, etc.]

## How to start a return

[Steps and who to contact.]

## Refunds

[How and when refunds are made, e.g. back to GCash or card within x days.]

> Have a lawyer review this page against the Consumer Act of the Philippines (RA 7394).
', false, true, 3, CURRENT_TIMESTAMP);
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('terms', 'Terms of service', 'The terms for using this site and ordering.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## Orders

[When an order is confirmed, pricing errors, cancellations.]

## Payments

[Accepted payment methods: GCash, Maya, card, QR Ph and cash on delivery.]

## Contact

[How to reach you about these terms.]

> Have a lawyer review this page before publishing.
', false, true, 4, CURRENT_TIMESTAMP);
INSERT INTO "Page" ("slug", "title", "description", "content", "published", "showInFooter", "position", "updatedAt") VALUES ('privacy', 'Privacy policy', 'How we collect and use personal information.', '> **Draft:** replace the bracketed text, then publish this page in Site Studio → Pages.

## What we collect

[Name, email, mobile number, delivery address, order history.]

## How we use it

[To process and deliver orders, send order emails, and provide support.]

## Who we share it with

[Couriers, payment providers (PayMongo), email provider.]

## Your rights

[How customers can access, correct or delete their data.]

## Contact

[Your data protection officer or contact person.]

> Have a lawyer review this page against the Data Privacy Act of 2012 (RA 10173).
', false, true, 5, CURRENT_TIMESTAMP);
