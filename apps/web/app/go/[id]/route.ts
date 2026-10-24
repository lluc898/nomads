import {
  getTripLinkForRedirect,
  recordAffiliateClick,
} from "@viajeroshub/database";
import { createHash } from "node:crypto";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const link = await getTripLinkForRedirect(getDatabase(), id);
  if (!link || link.status !== "published")
    return new Response(null, { status: 404 });
  const session = await auth();
  if (link.visibility === "private" && session?.user?.id !== link.creatorId)
    return new Response(null, { status: 404 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const secret = process.env.AUTH_SECRET;
  const ipHash =
    ip && secret
      ? createHash("sha256").update(`${secret}:${ip}`).digest("hex")
      : null;
  await recordAffiliateClick(getDatabase(), {
    linkId: id,
    userId: session?.user?.id,
    userAgent: request.headers.get("user-agent"),
    ipHash,
  });
  return Response.redirect(link.url, 302);
}
