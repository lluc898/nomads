import { registerPushDevice, removePushDevice } from "@viajeroshub/database";
import { pushTokenInputSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";
import { authenticatedUserId } from "@/lib/request-auth";

export async function POST(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const parsed = pushTokenInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ message: "Token no válido." }, { status: 400 });
  await registerPushDevice(getDatabase(), { userId, ...parsed.data });
  return new Response(null, { status: 204 });
}

export async function DELETE(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const payload = (await request.json().catch(() => null)) as {
    token?: unknown;
  } | null;
  if (
    typeof payload?.token !== "string" ||
    payload.token.length < 10 ||
    payload.token.length > 255
  )
    return Response.json({ message: "Token no válido." }, { status: 400 });
  await removePushDevice(getDatabase(), userId, payload.token);
  return new Response(null, { status: 204 });
}

function unauthorized() {
  return Response.json({ message: "No autorizado." }, { status: 401 });
}
