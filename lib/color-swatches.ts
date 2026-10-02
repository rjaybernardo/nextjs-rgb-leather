// Swatch colors for common color names; anything else
// gets a neutral swatch (the name still shows beside it)
const SWATCHES: Record<string, string> = {
  black: "#2A2522",
  brown: "#6B3E21",
  "dark brown": "#3E2418",
  chocolate: "#3E2418",
  cognac: "#8A4A22",
  whiskey: "#9A5B2B",
  honey: "#B5762E",
  tan: "#C3925E",
  natural: "#C3925E",
  camel: "#B08454",
  beige: "#D8C3A5",
  oxblood: "#5B1F1B",
  burgundy: "#5B1F1B",
  mahogany: "#5A2A1E",
  red: "#8E2A23",
  olive: "#4E4B2C",
  green: "#2F4A33",
  navy: "#1F2A44",
  blue: "#2B4A6F",
  grey: "#8A8580",
  gray: "#8A8580",
  white: "#F2EEE7",
};

export const swatchColor = (name: string) => SWATCHES[name.trim().toLowerCase()] ?? "#B9AD9B";

export const isColorOption = (name: string) => /^colou?r$/i.test(name.trim());
