import { getUserProfileById } from "@viajeroshub/database";

import { requireApiAuth } from "@/lib/auth/guards";
import { getDatabase } from "@/lib/database";

export async function GET() {
  const authentication = await requireApiAuth();

  if (!authentication.ok) {
    return authentication.response;
  }

  const { id, name, email, image } = authentication.user;
  const profile = await getUserProfileById(getDatabase(), id);

  return Response.json({
    id,
    name,
    email,
    image: profile?.image ?? image,
    username: profile?.username ?? null,
    instagramUrl: profile?.instagramUrl ?? null,
    profileComplete: Boolean(profile?.username && profile.image),
  });
}
