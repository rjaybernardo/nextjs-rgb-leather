export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "RGB Leather";

export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  "Handcrafted leather goods.";

export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: "",
  password: "",
};

export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressDefaultValues = {
  fullName: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(",").map((method) => method.trim())
  : ["PayMongo", "CashOnDelivery"];

export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || "PayMongo";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PayMongo: "GCash, Maya, card or QR Ph",
  CashOnDelivery: "Cash on Delivery",
};

export const getPaymentMethodLabel = (method: string) =>
  PAYMENT_METHOD_LABELS[method] ?? method;

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return value !== undefined && value !== "" && Number.isFinite(parsed)
    ? parsed
    : fallback;
};

// Prices are VAT-inclusive; VAT is shown as the included portion
export const VAT_RATE = 0.12;

// Placeholder shipping rules; set SHIPPING_FEE and FREE_SHIPPING_MIN (in PHP)
// to your real rates. FREE_SHIPPING_MIN=0 turns free shipping off.
export const SHIPPING_FEE = numberFromEnv(process.env.SHIPPING_FEE, 150);

export const FREE_SHIPPING_MIN = numberFromEnv(
  process.env.FREE_SHIPPING_MIN,
  3000,
);

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 10;

export const productDefaultValues = {
  name: "",
  slug: "",
  category: "",
  images: [],
  brand: "",
  description: "",
  price: "0",
  stock: 0,
  rating: "0",
  numReviews: "0",
  isFeatured: false,
  banner: null,
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(",").map((role) => role.trim())
  : ["admin", "user"];
