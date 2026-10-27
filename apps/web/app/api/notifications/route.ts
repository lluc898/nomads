import {
  listUserNotifications,
  markUserNotificationsRead,
} from "@viajeroshub/database";
import {
  markNotificationsReadSchema,
  notificationCenterSchema,
} from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";
import { authenticatedUserId } from "@/lib/request-auth";

export async function GET(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const center = await listUserNotifications(getDatabase(), userId);
  return Response.json(notificationCenterSchema.parse(center), noStore());
}

export async function PATCH(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const parsed = markNotificationsReadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ message: "Solicitud no válida." }, { status: 400 });
  await markUserNotificationsRead(getDatabase(), userId, parsed.data);
  return new Response(null, { status: 204, headers: noStore().headers });
}

function unauthorized() {
  return Response.json({ message: "No autorizado." }, { status: 401 });
}

function noStore() {
  return { headers: { "Cache-Control": "private, no-store" } };
}
