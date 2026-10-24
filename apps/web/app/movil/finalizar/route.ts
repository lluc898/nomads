import { createMobileAuthCode } from "@viajeroshub/database";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import {
  createOpaqueToken,
  getSafeMobileReturnUrl,
  isValidPkceChallenge,
  sha256,
} from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = getSafeMobileReturnUrl(
    requestUrl.searchParams.get("returnTo"),
  );
  const challenge = requestUrl.searchParams.get("challenge") ?? "";
  if (!returnTo || !isValidPkceChallenge(challenge)) {
    return new Response("Solicitud móvil no válida.", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    const accessUrl = new URL("/movil/acceso", requestUrl.origin);
    accessUrl.searchParams.set("returnTo", returnTo.toString());
    accessUrl.searchParams.set("challenge", challenge);
    return NextResponse.redirect(accessUrl);
  }

  const code = createOpaqueToken();
  await createMobileAuthCode(getDatabase(), {
    codeHash: sha256(code),
    userId: session.user.id,
    pkceChallenge: challenge,
    expiresAt: new Date(Date.now() + 5 * 60 * 1_000),
  });
  returnTo.searchParams.set("code", code);
  return new Response(null, {
    status: 302,
    headers: { Location: returnTo.toString(), "Cache-Control": "no-store" },
  });
}
