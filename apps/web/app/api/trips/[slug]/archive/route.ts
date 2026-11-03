import {
  archiveTrip,
  TripAlreadyArchivedError,
  TripNotFoundError,
  TripOwnerRequiredError,
} from "@viajeroshub/database";
import { tripLifecycleResultSchema } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await authenticatedUserId(request);
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  try {
    const result = await archiveTrip(
      getDatabase(),
      (await params).slug,
      userId,
    );
    return Response.json(tripLifecycleResultSchema.parse(result));
  } catch (error) {
    if (error instanceof TripOwnerRequiredError) {
      return Response.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof TripAlreadyArchivedError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof TripNotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    throw error;
  }
}

async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}
