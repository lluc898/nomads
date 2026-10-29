import {
  createPublishedTrip,
  findTripCardPage,
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
  const origin = url.searchParams.get("origin") ?? undefined;
  const destination = url.searchParams.get("destination") ?? undefined;
  const departureDate = url.searchParams.get("departureDate") ?? undefined;
  const returnDate = url.searchParams.get("returnDate") ?? undefined;
  const flexibleMonth = url.searchParams.get("flexibleMonth") ?? undefined;
  const hasSearch = Boolean(
    origin || destination || departureDate || flexibleMonth,
  );
  const page = await findTripCardPage(getDatabase(), {
    origin,
    destination,
    departureDate,
    returnDate,
    flexibleMonth,
    userId: creatorId ?? undefined,
    locale,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: parseTripLimit(url.searchParams.get("limit")),
    includeTotal:
      hasSearch && url.searchParams.get("includeTotal") !== "false",
  });
  return Response.json(page, {
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

function parseTripLimit(value: string | null) {
  const parsed = Number(value ?? 12);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 30) : 12;
}
