import type {
  CreateTripInput,
  SupportedLocale,
  TripCard,
} from "@viajeroshub/shared";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database } from "./client";
import {
  affiliateClicks,
  airports,
  conversations,
  countries,
  tripLinks,
  tripParticipants,
  trips,
  users,
} from "./schema";

export class InvalidTripLocationError extends Error {}
export class TripNotFoundError extends Error {}
export class TripOwnerCannotJoinError extends Error {}
export class TripFullError extends Error {}
export class TripJoinRequestNotFoundError extends Error {}
export class TripOwnerRequiredError extends Error {}

export async function joinTrip(
  database: Database,
  slug: string,
  userId: string,
) {
  return database.transaction(async (transaction) => {
    const [trip] = await transaction
      .select({
        id: trips.id,
        creatorId: trips.creatorId,
        visibility: trips.visibility,
        maxParticipants: trips.maxParticipants,
      })
      .from(trips)
      .where(and(eq(trips.slug, slug), eq(trips.status, "published")))
      .for("update")
      .limit(1);
    if (!trip) throw new TripNotFoundError("Viaje no encontrado.");
    if (trip.creatorId === userId) {
      throw new TripOwnerCannotJoinError("Ya eres el creador de este viaje.");
    }

    const [existing] = await transaction
      .select({ status: tripParticipants.status })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, trip.id),
          eq(tripParticipants.userId, userId),
        ),
      )
      .limit(1);
    if (existing?.status === "approved" || existing?.status === "pending") {
      return { status: existing.status, created: false };
    }

    await assertTripHasCapacity(transaction, trip.id, trip.maxParticipants);
    const status = trip.visibility === "private" ? "pending" : "approved";
    await transaction
      .insert(tripParticipants)
      .values({
        tripId: trip.id,
        userId,
        status,
        respondedAt: status === "approved" ? new Date() : null,
        respondedBy: status === "approved" ? trip.creatorId : null,
      })
      .onConflictDoUpdate({
        target: [tripParticipants.tripId, tripParticipants.userId],
        set: {
          status,
          requestedAt: new Date(),
          respondedAt: status === "approved" ? new Date() : null,
          respondedBy: status === "approved" ? trip.creatorId : null,
        },
      });
    return { status, created: true };
  });
}

export async function reviewTripJoinRequest(
  database: Database,
  input: {
    slug: string;
    requestId: string;
    reviewerId: string;
    action: "accept" | "reject";
  },
) {
  return database.transaction(async (transaction) => {
    const [trip] = await transaction
      .select({
        id: trips.id,
        creatorId: trips.creatorId,
        maxParticipants: trips.maxParticipants,
      })
      .from(trips)
      .where(and(eq(trips.slug, input.slug), eq(trips.status, "published")))
      .for("update")
      .limit(1);
    if (!trip) throw new TripNotFoundError("Viaje no encontrado.");
    if (trip.creatorId !== input.reviewerId) {
      throw new TripOwnerRequiredError(
        "Solo el creador puede gestionar solicitudes.",
      );
    }
    const [request] = await transaction
      .select({ id: tripParticipants.id })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.id, input.requestId),
          eq(tripParticipants.tripId, trip.id),
          eq(tripParticipants.status, "pending"),
        ),
      )
      .for("update")
      .limit(1);
    if (!request) {
      throw new TripJoinRequestNotFoundError("Solicitud no encontrada.");
    }
    if (input.action === "accept") {
      await assertTripHasCapacity(transaction, trip.id, trip.maxParticipants);
    }
    const status = input.action === "accept" ? "approved" : "rejected";
    await transaction
      .update(tripParticipants)
      .set({
        status,
        respondedAt: new Date(),
        respondedBy: input.reviewerId,
      })
      .where(eq(tripParticipants.id, request.id));
    return { status };
  });
}

export async function getTripLinkForRedirect(
  database: Database,
  linkId: string,
) {
  const [result] = await database
    .select({
      affiliateUrl: tripLinks.affiliateUrl,
      originalUrl: tripLinks.originalUrl,
      visibility: trips.visibility,
      creatorId: trips.creatorId,
      status: trips.status,
      tripId: trips.id,
    })
    .from(tripLinks)
    .innerJoin(trips, eq(trips.id, tripLinks.tripId))
    .where(eq(tripLinks.id, linkId))
    .limit(1);
  return result
    ? { ...result, url: result.affiliateUrl ?? result.originalUrl }
    : null;
}

export async function canUserAccessTrip(
  database: Database,
  tripId: string,
  userId: string,
) {
  const [trip] = await database
    .select({ creatorId: trips.creatorId })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip) return false;
  if (trip.creatorId === userId) return true;
  const [participant] = await database
    .select({ id: tripParticipants.id })
    .from(tripParticipants)
    .where(
      and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, "approved"),
      ),
    )
    .limit(1);
  return Boolean(participant);
}

export async function recordAffiliateClick(
  database: Database,
  input: {
    linkId: string;
    userId?: string | null;
    userAgent?: string | null;
    ipHash?: string | null;
  },
) {
  await database.insert(affiliateClicks).values({
    tripLinkId: input.linkId,
    userId: input.userId ?? null,
    userAgent: input.userAgent?.slice(0, 512) ?? null,
    ipHash: input.ipHash ?? null,
  });
}

export async function createPublishedTrip(
  database: Database,
  creatorId: string,
  input: CreateTripInput,
) {
  return database.transaction(async (transaction) => {
    const origin = await resolveLocation(transaction, input.origin);
    const destination = await resolveLocation(transaction, input.destination);
    const suffix = crypto.randomUUID().slice(0, 8);
    const slug = `${slugify(destination.name)}-${suffix}`;
    const [trip] = await transaction
      .insert(trips)
      .values({
        creatorId,
        title: `Viaje a ${destination.name}`,
        slug,
        originCountryCode: origin.countryCode,
        originAirportId: origin.airportId,
        destinationCountryCode: destination.countryCode,
        destinationAirportId: destination.airportId,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        visibility: input.visibility,
        status: "published",
        maxParticipants: input.maxParticipants,
        budget: input.budget?.toFixed(2) ?? null,
        description: input.description,
      })
      .returning({ id: trips.id, slug: trips.slug });

    if (!trip) throw new Error("No se ha podido crear el viaje.");
    await transaction.insert(conversations).values({ tripId: trip.id });
    if (input.links.length) {
      await transaction.insert(tripLinks).values(
        input.links.map((link, position) => ({
          tripId: trip.id,
          name: link.name,
          type: link.type,
          originalUrl: link.url,
          affiliateUrl: null,
          affiliateStatus: "pending_review" as const,
          position,
        })),
      );
    }
    return trip;
  });
}

export async function findTripCards(
  database: Database,
  input: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    flexibleMonth?: string;
    userId?: string;
    locale?: SupportedLocale;
    limit?: number;
  } = {},
): Promise<TripCard[]> {
  const originCountry = alias(countries, "origin_country");
  const destinationCountry = alias(countries, "destination_country");
  const originAirport = alias(airports, "origin_airport");
  const destinationAirport = alias(airports, "destination_airport");
  const conditions: SQL[] = [eq(trips.status, "published")];
  addLocationCondition(conditions, input.origin, "origin");
  if (input.destination && input.destination !== "anywhere")
    addLocationCondition(conditions, input.destination, "destination");
  if (input.departureDate && input.returnDate) {
    conditions.push(lte(trips.departureDate, input.returnDate));
    conditions.push(gte(trips.returnDate, input.departureDate));
  } else if (input.flexibleMonth) {
    const start = `${input.flexibleMonth}-01`;
    const [year = 0, month = 0] = input.flexibleMonth.split("-").map(Number);
    const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    conditions.push(lte(trips.departureDate, end));
    conditions.push(gte(trips.returnDate, start));
  }
  if (input.userId) {
    conditions.push(
      or(
        eq(trips.creatorId, input.userId),
        sql`exists (
          select 1 from ${tripParticipants}
          where ${tripParticipants.tripId} = ${trips.id}
            and ${tripParticipants.userId} = ${input.userId}
            and ${tripParticipants.status} = 'approved'
        )`,
      )!,
    );
  }

  const rows = await database
    .select({
      id: trips.id,
      slug: trips.slug,
      departureDate: trips.departureDate,
      returnDate: trips.returnDate,
      visibility: trips.visibility,
      budget: trips.budget,
      currency: trips.currency,
      maxParticipants: trips.maxParticipants,
      approvedParticipantCount: sql<number>`(
        select count(*)::int from ${tripParticipants}
        where ${tripParticipants.tripId} = ${trips.id}
          and ${tripParticipants.status} = 'approved'
      )`,
      createdAt: trips.createdAt,
      creatorName: users.name,
      creatorUsername: users.username,
      originCountryCode: trips.originCountryCode,
      originCountryName: originCountry.name,
      originCountryNameEs: originCountry.nameEs,
      originAirportName: originAirport.name,
      originMunicipality: originAirport.municipality,
      originAirportCode: originAirport.iataCode,
      destinationCountryCode: trips.destinationCountryCode,
      destinationCountryName: destinationCountry.name,
      destinationCountryNameEs: destinationCountry.nameEs,
      destinationImageUrl: destinationCountry.heroImageUrl,
      destinationImageSourceUrl: destinationCountry.heroImageSourceUrl,
      destinationImageAuthor: destinationCountry.heroImageAuthor,
      destinationImageLicense: destinationCountry.heroImageLicense,
      destinationImageLicenseUrl: destinationCountry.heroImageLicenseUrl,
      destinationImageAlt: destinationCountry.heroImageAlt,
      destinationAirportName: destinationAirport.name,
      destinationMunicipality: destinationAirport.municipality,
      destinationAirportCode: destinationAirport.iataCode,
    })
    .from(trips)
    .innerJoin(users, eq(users.id, trips.creatorId))
    .leftJoin(originCountry, eq(originCountry.code, trips.originCountryCode))
    .leftJoin(
      destinationCountry,
      eq(destinationCountry.code, trips.destinationCountryCode),
    )
    .leftJoin(originAirport, eq(originAirport.id, trips.originAirportId))
    .leftJoin(
      destinationAirport,
      eq(destinationAirport.id, trips.destinationAirportId),
    )
    .where(and(...conditions))
    .orderBy(desc(trips.createdAt))
    .limit(Math.min(Math.max(input.limit ?? 30, 1), 100));

  const locale = input.locale ?? "es";
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    origin: locationLabel(row, "origin", locale),
    destination: locationLabel(row, "destination", locale),
    dateLabel: formatDateRange(row.departureDate!, row.returnDate!, locale),
    priceFrom: row.budget === null ? null : Number(row.budget),
    currency: row.currency,
    availablePlaces:
      row.maxParticipants === null
        ? null
        : Math.max(
            row.maxParticipants - 1 - Number(row.approvedParticipantCount),
            0,
          ),
    visibility: row.visibility,
    tags: [],
    creator: creatorLabel(row.creatorName, row.creatorUsername),
    publishedLabel: relativeDate(row.createdAt, locale),
    tone: toneFor(row.id),
    destinationImage:
      row.destinationImageUrl &&
      row.destinationImageSourceUrl &&
      row.destinationImageAuthor &&
      row.destinationImageLicense
        ? {
            url: row.destinationImageUrl,
            alt:
              row.destinationImageAlt ??
              `Paisaje de ${locationLabel(row, "destination", locale)}`,
            author: row.destinationImageAuthor,
            license: row.destinationImageLicense,
            sourceUrl: row.destinationImageSourceUrl,
            licenseUrl: row.destinationImageLicenseUrl,
          }
        : null,
  }));
}

export async function getTripDetail(
  database: Database,
  slug: string,
  locale: SupportedLocale = "es",
  viewerUserId?: string | null,
) {
  const [trip] = await database
    .select()
    .from(trips)
    .where(eq(trips.slug, slug))
    .limit(1);
  if (!trip || trip.status !== "published") return null;
  const [creator] = await database
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, trip.creatorId))
    .limit(1);
  const origin = await resolveLocation(
    database,
    trip.originAirportId
      ? `airport:${trip.originAirportId}`
      : `country:${trip.originCountryCode}`,
  );
  const destination = await resolveLocation(
    database,
    trip.destinationAirportId
      ? `airport:${trip.destinationAirportId}`
      : `country:${trip.destinationCountryCode}`,
  );
  const [viewerMembership] = viewerUserId
    ? await database
        .select({ status: tripParticipants.status })
        .from(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, trip.id),
            eq(tripParticipants.userId, viewerUserId),
          ),
        )
        .limit(1)
    : [];
  const viewerMembershipStatus =
    viewerUserId === trip.creatorId
      ? ("owner" as const)
      : (viewerMembership?.status ?? ("none" as const));
  const canViewPrivateContent =
    trip.visibility === "public" ||
    viewerMembershipStatus === "owner" ||
    viewerMembershipStatus === "approved";

  const approvedParticipants = await database
    .select({
      userId: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(tripParticipants)
    .innerJoin(users, eq(users.id, tripParticipants.userId))
    .where(
      and(
        eq(tripParticipants.tripId, trip.id),
        eq(tripParticipants.status, "approved"),
      ),
    )
    .orderBy(asc(tripParticipants.requestedAt));
  const links = canViewPrivateContent
    ? await database
        .select({
          id: tripLinks.id,
          name: tripLinks.name,
          type: tripLinks.type,
          originalUrl: tripLinks.originalUrl,
          affiliateUrl: tripLinks.affiliateUrl,
        })
        .from(tripLinks)
        .where(eq(tripLinks.tripId, trip.id))
        .orderBy(asc(tripLinks.position))
    : [];
  const pendingRequests =
    viewerMembershipStatus === "owner"
      ? await database
          .select({
            id: tripParticipants.id,
            userId: users.id,
            name: users.name,
            username: users.username,
            image: users.image,
            requestedAt: tripParticipants.requestedAt,
          })
          .from(tripParticipants)
          .innerJoin(users, eq(users.id, tripParticipants.userId))
          .where(
            and(
              eq(tripParticipants.tripId, trip.id),
              eq(tripParticipants.status, "pending"),
            ),
          )
          .orderBy(asc(tripParticipants.requestedAt))
      : [];
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  const localized = (location: Awaited<ReturnType<typeof resolveLocation>>) =>
    location.airportId
      ? location.name
      : (displayNames.of(location.countryCode) ?? location.name);
  return {
    ...trip,
    description: canViewPrivateContent ? trip.description : "",
    budget:
      canViewPrivateContent && trip.budget !== null
        ? Number(trip.budget)
        : null,
    origin: localized(origin),
    destination: localized(destination),
    creator,
    links,
    viewerMembershipStatus,
    canViewPrivateContent,
    availablePlaces:
      trip.maxParticipants === null
        ? null
        : Math.max(trip.maxParticipants - 1 - approvedParticipants.length, 0),
    isFull:
      trip.maxParticipants !== null &&
      1 + approvedParticipants.length >= trip.maxParticipants,
    participants: canViewPrivateContent
      ? [
          ...(creator
            ? [
                {
                  userId: creator.id,
                  name: creator.name,
                  username: creator.username,
                  image: creator.image,
                  role: "owner" as const,
                },
              ]
            : []),
          ...approvedParticipants.map((participant) => ({
            ...participant,
            role: "participant" as const,
          })),
        ]
      : [],
    pendingRequests: pendingRequests.map((request) => ({
      ...request,
      requestedAt: request.requestedAt.toISOString(),
    })),
  };
}

type CapacityDatabase = Pick<Database, "select">;

async function assertTripHasCapacity(
  database: CapacityDatabase,
  tripId: string,
  maxParticipants: number | null,
) {
  if (maxParticipants === null) return;
  const [result] = await database
    .select({ value: count() })
    .from(tripParticipants)
    .where(
      and(
        eq(tripParticipants.tripId, tripId),
        eq(tripParticipants.status, "approved"),
      ),
    );
  if (1 + Number(result?.value ?? 0) >= maxParticipants) {
    throw new TripFullError("Este viaje ya está completo.");
  }
}

type LocationDatabase = Pick<Database, "select">;

async function resolveLocation(database: LocationDatabase, id: string) {
  const [kind, rawIdentifier] = id.split(":");
  if (kind === "country") {
    const [country] = await database
      .select({ code: countries.code, name: countries.nameEs })
      .from(countries)
      .where(eq(countries.code, rawIdentifier!))
      .limit(1);
    if (!country) throw new InvalidTripLocationError("País no encontrado.");
    return { countryCode: country.code, airportId: null, name: country.name };
  }
  const airportId = Number(rawIdentifier);
  const [airport] = await database
    .select({
      id: airports.id,
      name: airports.name,
      municipality: airports.municipality,
      countryCode: airports.countryCode,
      code: airports.iataCode,
    })
    .from(airports)
    .where(eq(airports.id, airportId))
    .limit(1);
  if (!airport) throw new InvalidTripLocationError("Aeropuerto no encontrado.");
  return {
    countryCode: airport.countryCode,
    airportId: airport.id,
    name: `${airport.municipality ?? airport.name}${airport.code ? ` (${airport.code})` : ""}`,
  };
}

function addLocationCondition(
  conditions: SQL[],
  value: string | undefined,
  side: "origin" | "destination",
) {
  if (!value) return;
  const [kind, identifier] = value.split(":");
  if (kind === "country" && /^[A-Z]{2}$/.test(identifier ?? ""))
    conditions.push(
      eq(
        side === "origin"
          ? trips.originCountryCode
          : trips.destinationCountryCode,
        identifier!,
      ),
    );
  else if (kind === "airport" && /^\d+$/.test(identifier ?? ""))
    conditions.push(
      eq(
        side === "origin" ? trips.originAirportId : trips.destinationAirportId,
        Number(identifier),
      ),
    );
}

function locationLabel(
  row: Record<string, unknown>,
  side: "origin" | "destination",
  locale: SupportedLocale,
) {
  const prefix = side === "origin" ? "origin" : "destination";
  const municipality = row[`${prefix}Municipality`] as string | null;
  const airportName = row[`${prefix}AirportName`] as string | null;
  const airportCode = row[`${prefix}AirportCode`] as string | null;
  if (airportName)
    return `${municipality ?? airportName}${airportCode ? ` (${airportCode})` : ""}`;
  const countryCode = row[`${prefix}CountryCode`] as string | null;
  const fallback = (row[`${prefix}CountryNameEs`] ??
    row[`${prefix}CountryName`]) as string;
  return countryCode
    ? (new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ??
        fallback)
    : fallback;
}

function formatDateRange(from: string, to: string, locale: SupportedLocale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${formatter.format(new Date(`${from}T00:00:00Z`))} – ${formatter.format(new Date(`${to}T00:00:00Z`))}`;
}

function creatorLabel(name: string | null, username: string | null) {
  const display = name ?? username ?? "ViajerosHub";
  const initials = display
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return { name: display, initials };
}

function relativeDate(value: Date, locale: SupportedLocale) {
  const days = Math.round((value.getTime() - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    days,
    "day",
  );
}

function toneFor(id: string): TripCard["tone"] {
  return (["sea", "sunset", "forest"] as const)[id.charCodeAt(0) % 3]!;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}
