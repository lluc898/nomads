import { listUserTripConversations } from "@viajeroshub/database";
import { tripConversationCenterSchema } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const userId = getBearerToken(request)
    ? (await requireMobileAuth(request))?.user.id
    : (await auth())?.user?.id;
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const conversations = await listUserTripConversations(getDatabase(), userId);
  return Response.json(tripConversationCenterSchema.parse(conversations), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
