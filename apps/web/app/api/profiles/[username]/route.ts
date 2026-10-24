import { getUserProfileByUsername } from "@viajeroshub/database";
import { usernameSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";

type PublicProfileRouteProps = {
  params: Promise<{ username: string }>;
};

export async function GET(
  _request: Request,
  { params }: PublicProfileRouteProps,
) {
  const result = usernameSchema.safeParse((await params).username);

  if (!result.success) {
    return Response.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const profile = await getUserProfileByUsername(getDatabase(), result.data);

  if (!profile?.username) {
    return Response.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return Response.json({
    name: profile.name,
    username: profile.username,
    image: profile.image,
    instagramUrl: profile.instagramUrl,
  });
}
