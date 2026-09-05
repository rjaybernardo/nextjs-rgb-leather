"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { signInFormSchema } from "../validator";

export async function signInWithCredentials(
  _prevState: unknown,
  formData: FormData,
) {
  console.log("SIGN IN ACTION CALLED");
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

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
