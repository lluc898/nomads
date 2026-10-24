import type {
  CreateTripInput,
  SupportedLocale,
  TripCard,
} from "@viajeroshub/shared";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database } from "./client";
import {
  affiliateClicks,
  airports,
  countries,
  tripLinks,
  trips,
  users,
} from "./schema";

export class InvalidTripLocationError extends Error {}

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
    })
    .from(tripLinks)
    .innerJoin(trips, eq(trips.id, tripLinks.tripId))
    .where(eq(tripLinks.id, linkId))
    .limit(1);
  return result
    ? { ...result, url: result.affiliateUrl ?? result.originalUrl }
    : null;
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
    creatorId?: string;
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
  if (input.creatorId) conditions.push(eq(trips.creatorId, input.creatorId));

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
        : Math.max(row.maxParticipants - 1, 0),
    visibility: row.visibility,
    tags: [],
    creator: creatorLabel(row.creatorName, row.creatorUsername),
    publishedLabel: relativeDate(row.createdAt, locale),
    tone: toneFor(row.id),
  }));
}

export async function getTripDetail(
  database: Database,
  slug: string,
  locale: SupportedLocale = "es",
) {
  const [trip] = await database
    .select()
    .from(trips)
    .where(eq(trips.slug, slug))
    .limit(1);
  if (!trip || trip.status !== "published") return null;
  const [creator] = await database
    .select({ name: users.name, username: users.username, image: users.image })
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
  const links = await database
    .select({
      id: tripLinks.id,
      name: tripLinks.name,
      type: tripLinks.type,
      originalUrl: tripLinks.originalUrl,
      affiliateUrl: tripLinks.affiliateUrl,
    })
    .from(tripLinks)
    .where(eq(tripLinks.tripId, trip.id))
    .orderBy(asc(tripLinks.position));
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  const localized = (location: Awaited<ReturnType<typeof resolveLocation>>) =>
    location.airportId
      ? location.name
      : (displayNames.of(location.countryCode) ?? location.name);
  return {
    ...trip,
    budget: trip.budget === null ? null : Number(trip.budget),
    origin: localized(origin),
    destination: localized(destination),
    creator,
    links,
  };
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
