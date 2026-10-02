"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hash } from "bcrypt-ts-edge";
import { AuthError } from "next-auth";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";

import {
  paymentMethodSchema,
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  updateUserSchema,
} from "../validators";
import { PAGE_SIZE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";

const persistGuestCart = async (userId: string) => {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) return;

  const sessionCart = await prisma.cart.findFirst({
    where: {
      sessionCartId,
    },
  });

  if (!sessionCart) return;

  await prisma.cart.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.cart.update({
    where: {
      id: sessionCart.id,
    },
    data: {
      userId,
    },
  });
};

// Reduce a callbackUrl to a same-site path to prevent open redirects
const getSafeCallbackUrl = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || value.length === 0) return "/";

  let url: URL;

  try {
    url = new URL(value, "http://localhost");
  } catch {
    return "/";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "/";

  // Collapse leading slashes so "//evil.com" can't become a protocol-relative URL
  return `${url.pathname.replace(/^\/+/, "/")}${url.search}${url.hash}`;
};

export async function signInWithCredentials(
  _prevState: unknown,
  formData: FormData,
) {
  let user;

  try {
    user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Password is verified once, in the Credentials provider's authorize()
    await signIn("credentials", {
      email: user.email,
      password: user.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message:
          error.type === "CredentialsSignin"
            ? "Invalid email or password"
            : "Something went wrong",
      };
    }

    return {
      success: false,
      message: formatError(error),
    };
  }

  const signedInUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
    },
  });

  if (signedInUser) {
    await persistGuestCart(signedInUser.id);
  }

  redirect(getSafeCallbackUrl(formData.get("callbackUrl")));
}

export async function signUp(_prevState: unknown, formData: FormData) {
  let user;

  try {
    user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: "User already exists with this email address",
      };
    }

    const hashedPassword = await hash(user.password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    await persistGuestCart(createdUser.id);
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }

  /*
   * Auth.js uses a redirect after successful authentication.
   * Let that redirect propagate through Next.js.
   */
  await signIn("credentials", {
    email: user.email,
    password: user.password,
    redirectTo: getSafeCallbackUrl(formData.get("callbackUrl")),
  });

  return {
    success: true,
    message: "User created successfully",
  };
}

export async function signOutUser() {
  const currentCart = await getMyCart();

  if (currentCart) {
    await prisma.cart.delete({
      where: {
        id: currentCart.id,
      },
    });
  }

  await signOut({
    redirectTo: "/",
  });
}

// Users may only read their own record; admins may read any
export async function getUserById(userId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User is not authenticated");
  }

  if (session.user.id !== userId && session.user.role !== "admin") {
    throw new Error("User not found");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// Update user's shipping address
export async function updateUserAddress(
  data: import("@/types").ShippingAddress,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in to update your address.",
      };
    }

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!currentUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        address,
      },
    });

    return {
      success: true,
      message: "User updated successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in to update your payment method.",
      };
    }

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!currentUser) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        paymentMethod: paymentMethod.type,
      },
    });

    return {
      success: true,
      message: "Payment method updated successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update User Profile
export async function updateProfile(user: { name: string; email: string }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User is not authenticated");
    }

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
      },
    });

    return {
      success: true,
      message: "User updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Get all users (Admin)
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  await requireAdmin();

  const queryFilter: Prisma.UserWhereInput =
    query && query !== "all"
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          },
        }
      : {};

  const [data, dataCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...queryFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
      omit: {
        password: true,
      },
    }),
    prisma.user.count({
      where: {
        ...queryFilter,
      },
    }),
  ]);

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete user by ID
export async function deleteUser(id: string) {
  try {
    await assertAdmin();

    await prisma.user.delete({
      where: {
        id,
      },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    await assertAdmin();

    const { id, name, role } = updateUserSchema.parse(user);

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        role,
      },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
