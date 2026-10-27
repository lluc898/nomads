import {
  getTripNotificationPreferences,
  setTripNotificationPreferences,
} from "@viajeroshub/database";
import { tripNotificationPreferencesSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";
import { authenticatedUserId } from "@/lib/request-auth";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  try {
    const value = await getTripNotificationPreferences(
      getDatabase(),
      userId,
      (await params).slug,
    );
    return Response.json(tripNotificationPreferencesSchema.parse(value));
  } catch {
    return Response.json({ message: "No autorizado." }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const parsed = tripNotificationPreferencesSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { message: "Preferencias no válidas." },
      { status: 400 },
    );
  try {
    const value = await setTripNotificationPreferences(
      getDatabase(),
      userId,
      (await params).slug,
      parsed.data.chatMuted,
    );
    return Response.json(tripNotificationPreferencesSchema.parse(value));
  } catch {
    return Response.json({ message: "No autorizado." }, { status: 403 });
  }
}

function unauthorized() {
  return Response.json({ message: "No autorizado." }, { status: 401 });
}
