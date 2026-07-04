"use server";

import { signIn, signOut } from "~/server/auth";

export async function signInWithDiscord(callbackUrl = "/") {
  await signIn("discord", { redirectTo: callbackUrl });
}

export async function signInWithDiscordForm(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  await signInWithDiscord(callbackUrl);
}

export async function signOutFromApp() {
  await signOut({ redirectTo: "/" });
}
