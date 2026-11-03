import {
  closeTrip,
  getTripDetail,
  TripAlreadyClosedError,
  TripNotFoundError,
  TripOwnerRequiredError,
} from "@viajeroshub/database";
import {
  isSupportedLocale,
  tripDetailSchema,
  tripLifecycleResultSchema,
} from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";
import { createTripLinkAccess } from "@/lib/trip-link-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestedLocale = new URL(request.url).searchParams.get("locale");
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "es";
  const userId = await authenticatedUserId(request);
  const trip = await getTripDetail(
    getDatabase(),
    (await params).slug,
    locale,
    userId,
  );
  if (!trip)
    return Response.json({ message: "Viaje no encontrado." }, { status: 404 });

  if (trip.visibility === "private" && !userId) {
    return Response.json({ message: "Viaje no encontrado." }, { status: 404 });
  }

  return Response.json(
    tripDetailSchema.parse({
      id: trip.id,
      slug: trip.slug,
      status: trip.status,
      origin: trip.origin,
      destination: trip.destination,
      destinationImage: trip.destinationImage,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      description: trip.description ?? "",
      visibility: trip.visibility,
      budget: trip.budget,
      currency: trip.currency,
      maxParticipants: trip.maxParticipants,
      availablePlaces: trip.availablePlaces,
      isFull: trip.isFull,
      canViewPrivateContent: trip.canViewPrivateContent,
      viewerMembershipStatus: trip.viewerMembershipStatus,
      creator: trip.creator
        ? { name: trip.creator.name, username: trip.creator.username }
        : null,
      links: trip.links.map(({ id, name, type }) => ({
        id,
        name,
        type,
        href:
          trip.visibility === "private" && userId && process.env.AUTH_SECRET
            ? `/go/${id}?access=${encodeURIComponent(
                createTripLinkAccess(id, userId, process.env.AUTH_SECRET),
              )}`
            : `/go/${id}`,
      })),
      participants: trip.participants,
      pendingRequests: trip.pendingRequests,
    }),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await authenticatedUserId(request);
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
  } | null;
  if (payload?.action !== "close") {
    return Response.json({ message: "Acción no válida." }, { status: 400 });
  }
  try {
    const result = await closeTrip(getDatabase(), (await params).slug, userId);
    return Response.json(tripLifecycleResultSchema.parse(result));
  } catch (error) {
    if (error instanceof TripOwnerRequiredError) {
      return Response.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof TripAlreadyClosedError) {
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
