import {
  createPublishedTrip,
  findTripCards,
  getUserProfileById,
  InvalidTripLocationError,
} from "@viajeroshub/database";
import { createTripInputSchema, isSupportedLocale } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "true";
  const creatorId = mine ? await authenticatedUserId(request) : undefined;
  if (mine && !creatorId)
    return Response.json({ message: "No autorizado." }, { status: 401 });
  const requestedLocale = url.searchParams.get("locale");
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "es";
  const cards = await findTripCards(getDatabase(), {
    origin: url.searchParams.get("origin") ?? undefined,
    destination: url.searchParams.get("destination") ?? undefined,
    departureDate: url.searchParams.get("departureDate") ?? undefined,
    returnDate: url.searchParams.get("returnDate") ?? undefined,
    flexibleMonth: url.searchParams.get("flexibleMonth") ?? undefined,
    creatorId: creatorId ?? undefined,
    locale,
  });
  return Response.json(cards, {
    headers: {
      "Cache-Control": mine
        ? "private, no-store"
        : "public, max-age=30, stale-while-revalidate=60",
    },
  });
}

export async function POST(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId)
    return Response.json({ message: "No autorizado." }, { status: 401 });

  const profile = await getUserProfileById(getDatabase(), userId);
  if (!profile?.username || !profile.image) {
    return Response.json(
      { message: "Completa tu perfil antes de crear un viaje." },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = createTripInputSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Revisa los datos del viaje.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.departureDate < today) {
    return Response.json(
      { message: "La fecha de ida no puede estar en el pasado." },
      { status: 400 },
    );
  }

  try {
    const trip = await createPublishedTrip(getDatabase(), userId, parsed.data);
    return Response.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidTripLocationError) {
      return Response.json({ message: error.message }, { status: 400 });
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
