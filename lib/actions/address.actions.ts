"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";
import { addressSchema, normalizePhone } from "@/lib/validators";

const MAX_ADDRESSES = 10;

type AddressInput = z.input<typeof addressSchema>;

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in");
  }

  return session.user.id;
}

const parseAddress = (data: AddressInput) => {
  const address = addressSchema.parse(data);

  return {
    label: address.label || null,
    fullName: address.fullName,
    phone: normalizePhone(address.phone),
    streetAddress: address.streetAddress,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
  };
};

// The snapshot saved on the user for checkout and copied onto the order
const toShippingAddress = (address: {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}) => ({
  fullName: address.fullName,
  phone: address.phone,
  streetAddress: address.streetAddress,
  city: address.city,
  province: address.province,
  postalCode: address.postalCode,
  country: address.country,
});

const revalidateAddressPages = () => {
  revalidatePath("/user/addresses");
  revalidatePath("/shipping-address");
};

export async function getMyAddresses() {
  const userId = await requireUserId();

  return prisma.address.findMany({
    where: {
      userId,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(
  data: AddressInput,
  options: { useForShipping?: boolean } = {},
) {
  try {
    const userId = await requireUserId();
    const address = parseAddress(data);

    const created = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({
        where: {
          userId,
        },
      });

      if (count >= MAX_ADDRESSES) {
        throw new Error(
          `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`,
        );
      }

      const makeDefault = count === 0 || data.isDefault === true;

      if (makeDefault) {
        await tx.address.updateMany({
          where: {
            userId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const newAddress = await tx.address.create({
        data: {
          ...address,
          userId,
          isDefault: makeDefault,
        },
      });

      if (options.useForShipping) {
        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            address: toShippingAddress(newAddress),
          },
        });
      }

      return newAddress;
    });

    revalidateAddressPages();

    return {
      success: true,
      message: "Address saved",
      addressId: created.id,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateAddress(id: string, data: AddressInput) {
  try {
    const userId = await requireUserId();
    const address = parseAddress(data);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Address not found");
      }

      if (data.isDefault === true && !existing.isDefault) {
        await tx.address.updateMany({
          where: {
            userId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      await tx.address.update({
        where: {
          id,
        },
        data: {
          ...address,
          ...(data.isDefault === true ? { isDefault: true } : {}),
        },
      });
    });

    revalidateAddressPages();

    return {
      success: true,
      message: "Address updated",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteAddress(id: string) {
  try {
    const userId = await requireUserId();

    await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Address not found");
      }

      await tx.address.delete({
        where: {
          id,
        },
      });

      // Keep a default: promote the most recent remaining address
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (next) {
          await tx.address.update({
            where: {
              id: next.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }
    });

    revalidateAddressPages();

    return {
      success: true,
      message: "Address deleted",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function setDefaultAddress(id: string) {
  try {
    const userId = await requireUserId();

    await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Address not found");
      }

      await tx.address.updateMany({
        where: {
          userId,
        },
        data: {
          isDefault: false,
        },
      });

      await tx.address.update({
        where: {
          id,
        },
        data: {
          isDefault: true,
        },
      });
    });

    revalidateAddressPages();

    return {
      success: true,
      message: "Default address updated",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Checkout: ship this order to one of the saved addresses
export async function selectShippingAddress(id: string) {
  try {
    const userId = await requireUserId();

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // Older addresses may be missing a mobile number or province
    const complete = addressSchema.safeParse({
      ...address,
      label: address.label ?? undefined,
    });

    if (!complete.success) {
      return {
        success: false,
        message: "This address is incomplete. Edit it to add the missing details.",
        incomplete: true,
      };
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        address: toShippingAddress(address),
      },
    });

    return {
      success: true,
      message: "Shipping address selected",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
