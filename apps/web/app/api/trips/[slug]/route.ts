import { getTripDetail } from "@viajeroshub/database";
import { isSupportedLocale, tripDetailSchema } from "@viajeroshub/shared";

import { auth } from "@/auth";
import { getDatabase } from "@/lib/database";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestedLocale = new URL(request.url).searchParams.get("locale");
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "es";
  const trip = await getTripDetail(getDatabase(), (await params).slug, locale);
  if (!trip)
    return Response.json({ message: "Viaje no encontrado." }, { status: 404 });

  const userId = await authenticatedUserId(request);
  if (trip.visibility === "private" && userId !== trip.creatorId) {
    return Response.json({ message: "Viaje no encontrado." }, { status: 404 });
  }

  return Response.json(
    tripDetailSchema.parse({
      id: trip.id,
      slug: trip.slug,
      origin: trip.origin,
      destination: trip.destination,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      description: trip.description ?? "",
      visibility: trip.visibility,
      budget: trip.budget,
      currency: trip.currency,
      maxParticipants: trip.maxParticipants,
      creator: trip.creator
        ? { name: trip.creator.name, username: trip.creator.username }
        : null,
      links: trip.links.map(({ id, name, type }) => ({ id, name, type })),
    }),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}
