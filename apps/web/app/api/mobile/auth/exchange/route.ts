import { exchangeMobileAuthCode } from "@viajeroshub/database";
import { mobileAuthExchangeSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";
import {
  createOpaqueToken,
  MOBILE_SESSION_DAYS,
  sha256,
} from "@/lib/mobile-auth";

export async function POST(request: Request) {
  const parsed = mobileAuthExchangeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ message: "Solicitud no válida." }, { status: 400 });
  }

  const token = createOpaqueToken();
  const userId = await exchangeMobileAuthCode(getDatabase(), {
    codeHash: sha256(parsed.data.code),
    pkceChallenge: sha256(parsed.data.verifier),
    tokenHash: sha256(token),
    sessionExpiresAt: new Date(
      Date.now() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1_000,
    ),
  });

  if (!userId) {
    return Response.json(
      { message: "El enlace ha caducado o ya se ha utilizado." },
      { status: 401 },
    );
  }

  return Response.json({ token, expiresInDays: MOBILE_SESSION_DAYS });
}
