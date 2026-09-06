"use server";

import { AuthError } from "next-auth";
import { hashSync } from "bcrypt-ts-edge";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

import { signInFormSchema, signUpFormSchema } from "../validator";

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
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const callbackUrlValue = formData.get("callbackUrl");

    const callbackUrl =
      typeof callbackUrlValue === "string" && callbackUrlValue
        ? callbackUrlValue
        : "/";

    const plainPassword = user.password;

    const hashedPassword = hashSync(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
      redirectTo: callbackUrl,
    });

    return {
      success: true,
      message: "User created successfully",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "User created, but automatic sign in failed",
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

export async function signOutUser() {
  await signOut({
    redirectTo: "/",
  });
}
