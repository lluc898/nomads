"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePageAuth } from "@/lib/auth/guards";
import { getSafeCallbackUrl } from "@/lib/auth/redirects";
import { saveProfile } from "@/lib/profile/save-profile";

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  imageUrl?: string;
  errors?: Partial<Record<"username" | "photo" | "instagram", string[]>>;
};

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requirePageAuth();
  const result = await saveProfile(user.id, formData);

  if (!result.ok) {
    return { status: "error", message: result.message, errors: result.errors };
  }

  revalidatePath("/perfil");
  revalidatePath(`/viajeros/${result.profile.username}`);

  if (result.wasFirstSave) {
    redirect(getSafeCallbackUrl(String(formData.get("callbackUrl") ?? "")));
  }

  return {
    status: "success",
    imageUrl: result.profile.image ?? undefined,
    message: "Perfil actualizado.",
  };
}
