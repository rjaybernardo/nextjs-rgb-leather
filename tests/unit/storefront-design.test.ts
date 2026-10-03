import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AccentText, { stripAccents } from "@/components/shared/accent-text";
import { isColorOption, swatchColor } from "@/lib/color-swatches";
import { designSections, DESIGN_SETTINGS } from "@/lib/design-preset";
import {
  DEFAULT_SITE_SETTINGS,
  SECTION_DEFAULTS,
  SECTION_FIELDS,
  SECTION_TYPES,
  sectionSchemas,
  siteSettingsSchema,
} from "@/lib/site-config";

const render = (text: string) => renderToStaticMarkup(createElement(AccentText, { text }));

describe("AccentText", () => {
  it("wraps starred words in the accent font", () => {
    expect(render("What do you *carry?*")).toBe('What do you <span class="font-accent">carry?</span>');
  });

  it("leaves text without asterisks alone", () => {
    expect(render("Plain title")).toBe("Plain title");
    expect(render("5 * 3")).toBe("5 * 3");
  });

  it("strips the markers for plain-text uses", () => {
    expect(stripAccents("Reviewed after *years,* not days.")).toBe("Reviewed after years, not days.");
  });
});

describe("color swatches", () => {
  it("knows common color names, case-insensitively", () => {
    expect(swatchColor("Cognac")).toBe("#8A4A22");
    expect(swatchColor(" oxblood ")).toBe("#5B1F1B");
  });

  it("falls back to a neutral swatch", () => {
    expect(swatchColor("Sunset Orange")).toBe("#B9AD9B");
  });

  it("recognizes color options in either spelling", () => {
    expect(isColorOption("Color")).toBe(true);
    expect(isColorOption("colour")).toBe(true);
    expect(isColorOption("Size")).toBe(false);
  });
});

describe("home sections", () => {
  it.each(SECTION_TYPES)("%s defaults pass their schema and have editor fields", (type) => {
    expect(sectionSchemas[type].safeParse(SECTION_DEFAULTS[type]()).success).toBe(true);
    expect(SECTION_FIELDS[type].length).toBeGreaterThan(0);
  });

  it("rejects a spotlight product address with spaces", () => {
    const result = sectionSchemas.spotlight.safeParse({
      ...SECTION_DEFAULTS.spotlight(),
      productSlug: "The Bifold",
    });

    expect(result.success).toBe(false);
  });
});

describe("starter layout preset", () => {
  const DESIGN_SECTIONS = designSections();

  it.each(DESIGN_SECTIONS.map((section) => [section.type, section] as const))(
    "%s section is valid",
    (type, section) => {
      expect(sectionSchemas[type].safeParse(section.data).success).toBe(true);
    },
  );

  it("uses pesos, not dollars", () => {
    expect(JSON.stringify(DESIGN_SECTIONS)).not.toContain("$");
  });

  it("is brand-neutral, so any store can reuse it", () => {
    const copy = JSON.stringify([
      DESIGN_SECTIONS,
      DESIGN_SETTINGS,
      DEFAULT_SITE_SETTINGS,
      SECTION_TYPES.map((type) => SECTION_DEFAULTS[type]()),
    ]);

    expect(copy).not.toMatch(/rgb|leather|cordovan/i);
  });

  it("produces valid site settings", () => {
    const merged = {
      ...DEFAULT_SITE_SETTINGS,
      theme: { ...DEFAULT_SITE_SETTINGS.theme, ...DESIGN_SETTINGS.theme },
      announcement: { ...DEFAULT_SITE_SETTINGS.announcement, ...DESIGN_SETTINGS.announcement },
    };

    expect(siteSettingsSchema.safeParse(merged).success).toBe(true);
  });
});
