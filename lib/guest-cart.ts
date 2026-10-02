import "server-only";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/*
 * After sign-in, the guest cart (from the sessionCartId cookie) becomes the
 * customer's cart. An empty guest cart is ignored so it can't wipe items the
 * customer saved while signed in earlier.
 */
export async function persistGuestCart(userId: string) {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) return;

  const sessionCart = await prisma.cart.findFirst({
    where: {
      sessionCartId,
      userId: null,
    },
  });

  if (!sessionCart || !Array.isArray(sessionCart.items) || sessionCart.items.length === 0) {
    return;
  }

  await prisma.$transaction([
    prisma.cart.deleteMany({ where: { userId } }),
    prisma.cart.update({
      where: { id: sessionCart.id },
      // A code applied as a guest is re-checked against this customer later
      data: { userId, couponCode: null, discountPrice: 0 },
    }),
  ]);
}
