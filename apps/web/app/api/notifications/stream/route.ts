import { subscribeToUserNotifications } from "@viajeroshub/database";

import { getDatabase } from "@/lib/database";
import { authenticatedUserId } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      unsubscribe = await subscribeToUserNotifications(
        getDatabase(),
        userId,
        () =>
          controller.enqueue(
            encoder.encode("event: notifications\ndata: {}\n\n"),
          ),
      );
      heartbeat = setInterval(
        () => controller.enqueue(encoder.encode(": heartbeat\n\n")),
        25_000,
      );
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "private, no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
