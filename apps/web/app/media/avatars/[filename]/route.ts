import { readStoredProfilePhoto } from "@/lib/profile/avatar-storage";

type AvatarRouteProps = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, { params }: AvatarRouteProps) {
  const photo = await readStoredProfilePhoto((await params).filename);

  if (!photo) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(photo), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
