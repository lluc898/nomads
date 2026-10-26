import {
  getTripConversationId,
  subscribeToTripMessages,
  TripChatAccessError,
  TripChatNotFoundError,
} from "@viajeroshub/database";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await authenticatedUserId(request);
  if (!userId) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  let conversationId: string;
  try {
    conversationId = await getTripConversationId(
      getDatabase(),
      (await params).slug,
      userId,
    );
  } catch (error) {
    if (error instanceof TripChatAccessError) {
      return Response.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof TripChatNotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    throw error;
  }

  const encoder = new TextEncoder();
  let cleanup: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  const stream = new ReadableStream({
    start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        cleanup();
        try {
          controller.close();
        } catch {
          // The client may already have closed the stream.
        }
      };
      request.signal.addEventListener("abort", close, { once: true });
      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
      heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 20_000);
      void subscribeToTripMessages(getDatabase(), conversationId, () => {
        if (!closed)
          controller.enqueue(encoder.encode("event: messages\ndata: {}\n\n"));
      })
        .then((unsubscribe) => {
          if (closed) unsubscribe();
          else cleanup = unsubscribe;
        })
        .catch((error) => {
          if (!closed) controller.error(error);
          close();
        });
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "private, no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}
