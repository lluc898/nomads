import {
  createChatNotifications,
  listTripMessages,
  markTripChatNotificationsRead,
  sendTripMessage,
  TripChatAccessError,
  TripChatNotFoundError,
  TripChatRateLimitError,
} from "@viajeroshub/database";
import {
  chatMessageSchema,
  sendChatMessageSchema,
  tripChatSchema,
} from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { sendNotificationPushes } from "@/lib/notification-push";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  try {
    const database = getDatabase();
    const slug = (await params).slug;
    const messages = await listTripMessages(database, slug, userId);
    await markTripChatNotificationsRead(database, slug, userId);
    return Response.json(tripChatSchema.parse({ messages }), noStore());
  } catch (error) {
    return chatErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const userId = await authenticatedUserId(request);
  if (!userId) return unauthorized();
  const parsed = sendChatMessageSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { message: "El mensaje no es válido.", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const slug = (await params).slug;
    const database = getDatabase();
    const message = await sendTripMessage(database, {
      slug,
      userId,
      content: parsed.data.content,
    });
    const notificationIds = await createChatNotifications(database, {
      slug,
      actorId: userId,
      preview: message.content,
    });
    await sendNotificationPushes(database, notificationIds);
    return Response.json(chatMessageSchema.parse(message), {
      status: 201,
      headers: noStore().headers,
    });
  } catch (error) {
    return chatErrorResponse(error);
  }
}

async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}

function unauthorized() {
  return Response.json({ message: "No autorizado." }, { status: 401 });
}

function noStore() {
  return { headers: { "Cache-Control": "private, no-store" } };
}

function chatErrorResponse(error: unknown) {
  if (error instanceof TripChatNotFoundError) {
    return Response.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof TripChatAccessError) {
    return Response.json({ message: error.message }, { status: 403 });
  }
  if (error instanceof TripChatRateLimitError) {
    return Response.json({ message: error.message }, { status: 429 });
  }
  throw error;
}
