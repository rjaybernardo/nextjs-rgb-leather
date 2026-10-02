import { COURIERS, PAYMENT_METHODS, USER_ROLES } from "@/lib/constants";
import { z } from "zod";

const currency = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+(\.\d{1,2})?$/.test(value),
    "Price must be a valid amount with up to two decimal places",
  )
  .transform((value) => Number(value));

export const insertProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  categoryId: z.string().min(1, "Choose a category"),
  brandId: z.string().min(1, "Choose a brand"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative"),
  images: z
    .array(z.string().min(1, "Image URL is required"))
    .min(1, "Product must have at least one image"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

// Schema for updating a product
export const updateProductSchema = insertProductSchema.extend({
  id: z.string().min(1, "Id is required"),
});

export const signInFormSchema = z.object({
  email: z.email({
    error: "Invalid email address",
  }),

  password: z.string().min(1, {
    error: "Password is required",
  }),
});

export const signUpFormSchema = z
  .object({
    name: z.string().min(3, {
      error: "Name must be at least 3 characters",
    }),

    email: z.email({
      error: "Invalid email address",
    }),

    password: z.string().min(6, {
      error: "Password must be at least 6 characters",
    }),

    confirmPassword: z.string().min(6, {
      error: "Confirm password must be at least 6 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Cart
export const cartItemSchema = z.object({
  productId: z.string().min(1, {
    error: "Product is required",
  }),

  name: z.string().min(1, {
    error: "Name is required",
  }),

  slug: z.string().min(1, {
    error: "Slug is required",
  }),

  qty: z
    .number()
    .int({
      error: "Quantity must be a whole number",
    })
    .nonnegative({
      error: "Quantity must be a non-negative number",
    }),

  image: z.string().min(1, {
    error: "Image is required",
  }),

  price: z
    .number()
    .refine((value) => /^\d+(\.\d{2})?$/.test(value.toFixed(2)), {
      error: "Price must have exactly two decimal places (e.g., 49.99)",
    }),

  // Set for products with variants, e.g. "Brown / M"
  variantId: z.string().optional(),
  variantTitle: z.string().optional(),
});

// The same product in two variants is two cart lines
export const sameCartLine = (
  a: { productId: string; variantId?: string },
  b: { productId: string; variantId?: string },
) => a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),

  itemsPrice: currency,

  totalPrice: currency,

  shippingPrice: currency,

  taxPrice: currency,

  sessionCartId: z.string().min(1, {
    error: "Session cart id is required",
  }),

  userId: z.string().optional().nullable(),
});

// Shipping Address
// Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX (spaces/dashes ok),
// stored in international form (+639XXXXXXXXX)
export const normalizePhone = (value: string) => {
  const digits = value.replace(/[\s()-]/g, "");

  return /^09\d{9}$/.test(digits) ? `+63${digits.slice(1)}` : digits;
};

const PH_MOBILE = /^(\+639|09)\d{9}$/;

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(3, "Name must be at least 3 characters"),

  phone: z
    .string()
    .trim()
    .refine(
      (value) => PH_MOBILE.test(normalizePhone(value)),
      "Enter a mobile number like 0917 123 4567",
    ),

  streetAddress: z
    .string()
    .trim()
    .min(3, "Enter house number, street and barangay"),

  city: z.string().trim().min(2, "Enter your city or municipality"),

  province: z.string().trim().min(2, "Enter your province"),

  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "ZIP code must be 4 digits"),

  country: z.string().trim().min(2, "Enter your country"),

  lat: z.number().optional(),

  lng: z.number().optional(),
});

// Address book entry
export const addressSchema = shippingAddressSchema.extend({
  label: z.string().trim().max(30, "Label must be at most 30 characters").optional(),

  isDefault: z.boolean().optional(),
});

// Payment Method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, "Payment method is required"),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    path: ["type"],
    message: "Invalid payment method",
  });

// Order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, {
    error: "User is required",
  }),

  itemsPrice: currency,

  shippingPrice: currency,

  taxPrice: currency,

  totalPrice: currency,

  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    error: "Invalid payment method",
  }),

  shippingAddress: shippingAddressSchema,
});

// Order Item
export const insertOrderItemSchema = z.object({
  variantId: z.string().nullish(),
  variantTitle: z.string().nullish(),

  productId: z.string().min(1, {
    error: "Product is required",
  }),

  slug: z.string().min(1, {
    error: "Slug is required",
  }),

  image: z.string().min(1, {
    error: "Image is required",
  }),

  name: z.string().min(1, {
    error: "Name is required",
  }),

  price: currency,

  qty: z
    .number()
    .int({
      error: "Quantity must be a whole number",
    })
    .positive({
      error: "Quantity must be greater than zero",
    }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email({
    error: "Invalid email address",
  }),
});

// Update User Schema
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, "Id is required"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  role: z.enum(USER_ROLES, {
    error: "Invalid role",
  }),
});

// Password reset
export const forgotPasswordSchema = z.object({
  email: z.email({
    error: "Invalid email address",
  }),
});

export const resetPasswordSchema = z
  .object({
    email: z.email({
      error: "Invalid reset link",
    }),

    token: z.string().min(1, {
      error: "Invalid reset link",
    }),

    password: z.string().min(6, {
      error: "Password must be at least 6 characters",
    }),

    confirmPassword: z.string().min(6, {
      error: "Confirm password must be at least 6 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Reviews
export const insertReviewSchema = z.object({
  productId: z.string().min(1, "Product is required"),

  rating: z.coerce
    .number()
    .int()
    .min(1, "Choose a rating from 1 to 5 stars")
    .max(5, "Choose a rating from 1 to 5 stars"),

  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),

  description: z
    .string()
    .trim()
    .min(3, "Review must be at least 3 characters")
    .max(2000, "Review must be at most 2000 characters"),
});

// Admin shipping settings (PHP)
export const shippingSettingsSchema = z.object({
  shippingFee: z.coerce
    .number({ error: "Enter the shipping fee in pesos" })
    .min(0, "Shipping fee can't be negative")
    .max(100000, "Shipping fee looks too high"),

  freeShippingMin: z.coerce
    .number({ error: "Enter an amount in pesos, or 0 to turn it off" })
    .min(0, "Amount can't be negative"),
});

// Shipping an order
export const shipmentSchema = z.object({
  courier: z.enum(COURIERS, {
    error: "Choose a courier",
  }),

  trackingNumber: z
    .string()
    .trim()
    .max(60, "Tracking number is too long")
    .optional()
    .transform((value) => value || undefined),
});

// Category or brand name
export const taxonomyNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters");

// Discount codes (admin). Dates are datetime-local values in Philippine time.
const optionalWholeNumber = z
  .union([z.literal(""), z.null(), z.coerce.number().int("Use a whole number").min(1, "Must be at least 1")])
  .transform((value) => (value === "" || value === null ? null : value));

const optionalAmount = z
  .union([z.literal(""), z.null(), z.coerce.number().min(0, "Can't be negative")])
  .transform((value) => (value === "" || value === null ? null : value));

const optionalManilaDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(`${value}:00+08:00`)), "Choose a valid date and time")
  .transform((value) => (value ? new Date(`${value}:00+08:00`) : null));

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 to 30 letters, numbers, dashes or underscores"),
    description: z.string().trim().max(200),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().min(0),
    maxDiscount: optionalAmount,
    minOrder: z.coerce.number().min(0, "Can't be negative"),
    startsAt: optionalManilaDate,
    endsAt: optionalManilaDate,
    usageLimit: optionalWholeNumber,
    perCustomerLimit: optionalWholeNumber,
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENT" && (data.value < 1 || data.value > 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percent must be between 1 and 100" });
    }

    if (data.type === "FIXED" && data.value <= 0) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an amount above ₱0" });
    }

    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after the start" });
    }
  });
