"use server";
import { signIn as nextAuthSignIn } from "@/auth";
import { redirect } from "next/navigation";

export async function signIn(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string } | void> {
  try {
    await nextAuthSignIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: "Email ou mot de passe incorrect" };
  }
}
