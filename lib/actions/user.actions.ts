"use server";

import { cookies } from "next/headers";
import { compareSync, hashSync } from "bcrypt-ts-edge";
import { AuthError } from "next-auth";

import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
} from "../validators";

const persistGuestCart = async (userId: string) => {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) {
    return;
  }

  const sessionCart = await prisma.cart.findFirst({
    where: {
      sessionCartId,
    },
  });

  if (!sessionCart) {
    return;
  }

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
      typeof callbackUrlValue === "string" && callbackUrlValue
        ? callbackUrlValue
        : "/";

    await signIn("credentials", {
      ...user,
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
    typeof callbackUrlValue === "string" && callbackUrlValue
      ? callbackUrlValue
      : "/";

  /*
   * Do not wrap signIn() in the database error handler above.
   *
   * Auth.js uses a redirect when authentication succeeds.
   * That redirect must be allowed to propagate through Next.js.
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
