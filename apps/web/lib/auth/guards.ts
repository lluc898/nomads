import "server-only";

import { redirect } from "next/navigation";

import { getUserProfileById } from "@viajeroshub/database";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";

import { getProfileSetupUrl } from "./redirects";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requirePageAuth() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/acceso");
  }

  return user;
}

export async function requireCompleteProfilePage(callbackUrl: string) {
  const user = await requirePageAuth();
  const profile = await getUserProfileById(getDatabase(), user.id);

  if (!profile?.username) {
    redirect(getProfileSetupUrl(callbackUrl));
  }

  return { user, profile };
}

export async function requireApiAuth() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return {
      ok: false as const,
      response: Response.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  return { ok: true as const, user };
}
