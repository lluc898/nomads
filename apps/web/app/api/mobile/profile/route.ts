import { revalidatePath } from "next/cache";

import { requireMobileAuth } from "@/lib/mobile-auth";
import { saveProfile } from "@/lib/profile/save-profile";

export async function GET(request: Request) {
  const authentication = await requireMobileAuth(request);
  if (!authentication) return unauthorized();
  return profileResponse(authentication.user);
}

export async function PATCH(request: Request) {
  const authentication = await requireMobileAuth(request);
  if (!authentication) return unauthorized();

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return Response.json({ message: "Formato no válido." }, { status: 415 });
  }

  const formData = await request.formData();
  const result = await saveProfile(authentication.user.id, formData);
  if (!result.ok) {
    return Response.json(
      { message: result.message, errors: result.errors },
      { status: result.status },
    );
  }

  revalidatePath("/perfil");
  revalidatePath(`/viajeros/${result.profile.username}`);
  return profileResponse({
    ...authentication.user,
    ...result.profile,
  });
}

function profileResponse(profile: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username: string | null;
  instagramUrl: string | null;
}) {
  return Response.json(
    {
      ...profile,
      profileComplete: Boolean(profile.username && profile.image),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function unauthorized() {
  return Response.json({ message: "La sesión ha caducado." }, { status: 401 });
}
