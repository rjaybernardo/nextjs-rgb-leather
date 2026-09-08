"use server";

import { hashSync } from "bcrypt-ts-edge";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";

import { signInFormSchema, signUpFormSchema } from "../validators";

export async function signInWithCredentials(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

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

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });
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
