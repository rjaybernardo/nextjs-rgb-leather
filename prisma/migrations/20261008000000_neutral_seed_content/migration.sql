-- Brand-neutral placeholder copy for the seeded home sections and About page.
-- Only rows still holding the original seeded wording are changed, so
-- anything already edited in Site Studio is left alone.

UPDATE "HomeSection"
SET "data" = ("data"::jsonb || '{"heading": "Your headline goes here", "subheading": "One or two sentences on what you sell and why customers love it."}'::jsonb)::json,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'hero'
  AND "data"::jsonb ->> 'heading' = 'Leather goods made to last'
  AND "data"::jsonb ->> 'subheading' = 'Wallets, bags and belts cut and stitched for everyday use.';

UPDATE "HomeSection"
SET "data" = ("data"::jsonb || '{"body": "Tell customers who you are, what you make or sell, and what makes your store different."}'::jsonb)::json,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'story'
  AND "data"::jsonb ->> 'body' = 'Tell customers who you are, where your leather comes from and how each piece is made.';

UPDATE "Page"
SET "description" = 'Who we are and what we do.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'about'
  AND "description" = 'Who we are and how our leather goods are made.';

UPDATE "Page"
SET "content" = REPLACE(
      REPLACE("content", '## How we make our goods', '## What we offer'),
      '[Materials, where your leather comes from, how each piece is made.]',
      '[What you sell, where it comes from and what makes it different.]'
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'about'
  AND "content" LIKE '%[Materials, where your leather comes from, how each piece is made.]%';
