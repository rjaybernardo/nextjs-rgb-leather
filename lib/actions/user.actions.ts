"use server";

import { redirect } from "next/navigation";
import { hash } from "bcrypt-ts-edge";
import { AuthError } from "next-auth";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getSafeCallbackUrl } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";

import { SERVER_URL } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, verifyEmailEmail } from "@/lib/email-templates";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { persistGuestCart } from "@/lib/guest-cart";
import { consumeToken, createToken } from "@/lib/tokens";

import {
  forgotPasswordSchema,
  paymentMethodSchema,
  resetPasswordSchema,
  signInFormSchema,
  signUpFormSchema,
  updateUserSchema,
} from "../validators";
import { PAGE_SIZE } from "@/lib/constants";
import { getCheckoutPaymentMethods } from "@/lib/integrations";
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";

const HOUR = 60 * 60 * 1000;

const sendVerificationEmail = async (email: string) => {
  const token = await createToken("verify", email, 24 * HOUR);

  const verifyUrl = `${SERVER_URL}/verify-email?${new URLSearchParams({
    email,
    token,
  })}`;

  await sendEmail(await verifyEmailEmail(email, verifyUrl));
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

    await assertRateLimit({
      key: `signin-ip:${await getClientIp()}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    await assertRateLimit({
      key: `signin-email:${user.email.toLowerCase()}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
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

    await assertRateLimit({
      key: `signup-ip:${await getClientIp()}`,
      limit: 5,
      windowMs: HOUR,
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

    await sendVerificationEmail(createdUser.email);
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
    const { methods } = await getCheckoutPaymentMethods();

    if (!(methods as string[]).includes(paymentMethod.type)) {
      return {
        success: false,
        message: "That payment method isn't available right now. Please choose another.",
      };
    }

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
    const session = await assertAdmin();

    if (id === session.user.id) {
      throw new Error("You can't delete your own account");
    }

    // Orders cascade from users, so deleting a customer would erase sales history
    const orderCount = await prisma.order.count({
      where: {
        userId: id,
      },
    });

    if (orderCount > 0) {
      throw new Error(
        `This customer has ${orderCount} order${orderCount === 1 ? "" : "s"} and can't be deleted`,
      );
    }

    const deleted = await prisma.user.delete({
      where: {
        id,
      },
      select: {
        email: true,
      },
    });

    await recordAudit({
      actor: session,
      action: "user.delete",
      entityType: "user",
      entityId: id,
      details: { email: deleted.email },
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
    const session = await assertAdmin();

    const { id, name, role } = updateUserSchema.parse(user);

    if (id === session.user.id && role !== "admin") {
      throw new Error("You can't remove your own admin access");
    }

    const before = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        role: true,
        email: true,
      },
    });

    if (!before) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        role,
      },
    });

    await recordAudit({
      actor: session,
      action: before.role !== role ? "user.role.change" : "user.update",
      entityType: "user",
      entityId: id,
      details: {
        email: before.email,
        ...(before.role !== role ? { role: { before: before.role, after: role } } : {}),
        ...(before.name !== name ? { name: { before: before.name, after: name } } : {}),
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

const RESET_REQUESTED_MESSAGE =
  "If an account exists for that email, we've sent a link to reset your password.";

// Always answers the same way so it can't be used to check which emails exist
export async function requestPasswordReset(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const { email } = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    await assertRateLimit({
      key: `reset-ip:${await getClientIp()}`,
      limit: 5,
      windowMs: HOUR,
    });

    await assertRateLimit({
      key: `reset-email:${email.toLowerCase()}`,
      limit: 3,
      windowMs: HOUR,
    });

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        password: true,
      },
    });

    if (user?.password) {
      const token = await createToken("reset", user.email, HOUR);

      const resetUrl = `${SERVER_URL}/reset-password?${new URLSearchParams({
        email: user.email,
        token,
      })}`;

      await sendEmail(await passwordResetEmail(user.email, resetUrl));
    }

    return {
      success: true,
      message: RESET_REQUESTED_MESSAGE,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function resetPassword(_prevState: unknown, formData: FormData) {
  try {
    const data = resetPasswordSchema.parse({
      email: formData.get("email"),
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    await assertRateLimit({
      key: `reset-submit-ip:${await getClientIp()}`,
      limit: 10,
      windowMs: HOUR,
    });

    const isValid = await consumeToken("reset", data.email, data.token);

    if (!isValid) {
      return {
        success: false,
        message:
          "This reset link is invalid or has expired. Request a new one.",
      };
    }

    // Following the emailed link also proves the address belongs to them
    await prisma.user.update({
      where: {
        email: data.email,
      },
      data: {
        password: await hash(data.password, 10),
        emailVerified: new Date(),
      },
    });

    return {
      success: true,
      message: "Your password has been reset. You can now sign in.",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function resendVerificationEmail() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be signed in");
    }

    await assertRateLimit({
      key: `verify-resend:${session.user.id}`,
      limit: 3,
      windowMs: HOUR,
    });

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: "Your email is already confirmed.",
      };
    }

    await sendVerificationEmail(user.email);

    return {
      success: true,
      message: `We sent a confirmation link to ${user.email}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Starts Google sign-in; Auth.js redirects to Google and back
export async function signInWithGoogle(formData: FormData) {
  await signIn("google", {
    redirectTo: getSafeCallbackUrl(formData.get("callbackUrl")),
  });
}
