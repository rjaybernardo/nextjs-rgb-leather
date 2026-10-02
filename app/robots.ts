import type { MetadataRoute } from "next";

import { SERVER_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, per-customer or one-time pages have nothing to index
      disallow: [
        "/admin",
        "/studio",
        "/api",
        "/user",
        "/cart",
        "/shipping-address",
        "/payment-method",
        "/place-order",
        "/order",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${SERVER_URL}/sitemap.xml`,
  };
}
