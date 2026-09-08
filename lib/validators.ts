import { PAYMENT_METHODS } from "@/lib/constants";
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

  category: z.string().min(3, "Category must be at least 3 characters"),

  brand: z.string().min(3, "Brand must be at least 3 characters"),

  description: z.string().min(3, "Description must be at least 3 characters"),

  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative"),

  images: z.array(z.string()).min(1, "Product must have at least one image"),

  price: currency,

  isFeatured: z.boolean(),

  banner: z.string().nullable(),
});

export const signInFormSchema = z.object({
  email: z.email({
    error: "Invalid email address",
  }),

  password: z.string().min(3, {
    error: "Password must be at least 3 characters",
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

    password: z.string().min(3, {
      error: "Password must be at least 3 characters",
    }),

    confirmPassword: z.string().min(3, {
      error: "Confirm password must be at least 3 characters",
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
});

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

export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),

  streetAddress: z.string().min(3, "Address must be at least 3 characters"),

  city: z.string().min(3, "City must be at least 3 characters"),

  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),

  country: z.string().min(3, "Country must be at least 3 characters"),

  lat: z.number().optional(),

  lng: z.number().optional(),
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
