import {
  createJoinNotification,
  getUserProfileById,
  joinTrip,
  TripFullError,
  TripNotFoundError,
  TripOwnerCannotJoinError,
} from "@viajeroshub/database";
import { tripJoinResultSchema } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { sendNotificationPushes } from "@/lib/notification-push";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await authenticatedUserId(request);
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const profile = await getUserProfileById(getDatabase(), userId);
  if (!profile?.username || !profile.image) {
    return Response.json(
      { message: "Completa tu perfil antes de unirte a un viaje." },
      { status: 403 },
    );
  }
  try {
    const slug = (await params).slug;
    const database = getDatabase();
    const result = await joinTrip(database, slug, userId);
    if (result.created) {
      const notificationIds = await createJoinNotification(database, {
        slug,
        actorId: userId,
        status: result.status === "pending" ? "pending" : "approved",
      });
      await sendNotificationPushes(database, notificationIds);
    }
    return Response.json(tripJoinResultSchema.parse(result));
  } catch (error) {
    if (error instanceof TripNotFoundError)
      return Response.json({ message: error.message }, { status: 404 });
    if (error instanceof TripOwnerCannotJoinError)
      return Response.json({ message: error.message }, { status: 409 });
    if (error instanceof TripFullError)
      return Response.json({ message: error.message }, { status: 409 });
    throw error;
  }
}

async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}
