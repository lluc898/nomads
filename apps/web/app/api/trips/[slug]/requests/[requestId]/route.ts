import {
  reviewTripJoinRequest,
  TripFullError,
  TripJoinRequestNotFoundError,
  TripNotFoundError,
  TripOwnerRequiredError,
} from "@viajeroshub/database";
import { tripJoinReviewSchema } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; requestId: string }> },
) {
  const reviewerId = await authenticatedUserId(request);
  if (!reviewerId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const parsed = tripJoinReviewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ message: "Acción no válida." }, { status: 400 });
  }
  const { slug, requestId } = await params;
  try {
    const result = await reviewTripJoinRequest(getDatabase(), {
      slug,
      requestId,
      reviewerId,
      action: parsed.data.action,
    });
    return Response.json(result);
  } catch (error) {
    if (
      error instanceof TripNotFoundError ||
      error instanceof TripJoinRequestNotFoundError
    ) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof TripOwnerRequiredError)
      return Response.json({ message: error.message }, { status: 403 });
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
