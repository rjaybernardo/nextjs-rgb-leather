"use server";

import { cookies } from "next/headers";
import { compareSync, hashSync } from "bcrypt-ts-edge";
import { AuthError } from "next-auth";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
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

export async function signInWithCredentials(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const currentUser = await prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });

    if (!currentUser || !currentUser.password) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    const passwordMatches = compareSync(user.password, currentUser.password);

    if (!passwordMatches) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    await persistGuestCart(currentUser.id);

    const callbackUrlValue = formData.get("callbackUrl");

    const callbackUrl =
      typeof callbackUrlValue === "string" && callbackUrlValue.length > 0
        ? callbackUrlValue
        : "/";

    /*
     * Auth.js redirects after a successful sign-in.
     *
     * Do not catch/rewrite the redirect exception. It needs to
     * propagate through Next.js so the browser is redirected.
     */
    await signIn("credentials", {
      email: user.email,
      password: user.password,
      redirectTo: callbackUrl,
    });

    return {
      success: true,
      message: "Signed in successfully",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Invalid email or password",
          };

        default:
          return {
            success: false,
            message: "Something went wrong",
          };
      }
    }

    throw error;
  }
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

    const existingUser = await prisma.user.findFirst({
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

    const hashedPassword = hashSync(user.password, 10);

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

  const callbackUrlValue = formData.get("callbackUrl");

  const callbackUrl =
    typeof callbackUrlValue === "string" && callbackUrlValue.length > 0
      ? callbackUrlValue
      : "/";

  /*
   * Auth.js uses a redirect after successful authentication.
   * Let that redirect propagate through Next.js.
   */
  await signIn("credentials", {
    email: user.email,
    password: user.password,
    redirectTo: callbackUrl,
  });

  return {
    success: true,
    message: "User created successfully",
  };
}

export async function signOutUser() {
  await signOut({
    redirectTo: "/",
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
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

// Get all users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const data = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete user by ID
export async function deleteUser(id: string) {
  try {
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
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: user.name,
        role: user.role,
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
