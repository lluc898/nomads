import { eq, inArray, isNotNull } from "drizzle-orm";

import { createDatabase } from "./client";
import { airports, conversations, trips, users } from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL es obligatoria para crear viajes de muestra.");

const database = createDatabase(databaseUrl);
const creators = await database
  .select({ id: users.id, username: users.username })
  .from(users)
  .where(isNotNull(users.username))
  .orderBy(users.createdAt);

if (!creators.length) {
  console.log("No hay perfiles completos; no se crean viajes de muestra.");
  process.exit(0);
}

const originAirports = await database
  .select({ id: airports.id, iataCode: airports.iataCode })
  .from(airports)
  .where(inArray(airports.iataCode, ["BCN", "MAD", "PMI"]));
const airportByIata = new Map(
  originAirports.flatMap((airport) =>
    airport.iataCode ? [[airport.iataCode, airport.id] as const] : [],
  ),
);

const samples = [
  {
    slug: "barcelona-islandia-invierno-demo",
    title: "Viaje a Islandia",
    originAirportCode: "BCN",
    destinationCountryCode: "IS",
    departureDate: "2026-12-05",
    returnDate: "2026-12-12",
    visibility: "private" as const,
    maxParticipants: 5,
    budget: "950.00",
    description:
      "Road trip por el sur de Islandia para ver cascadas, playas negras y auroras. La ruta se decidirá entre todo el grupo.",
  },
  {
    slug: "madrid-japon-primavera-demo",
    title: "Viaje a Japón",
    originAirportCode: "MAD",
    destinationCountryCode: "JP",
    departureDate: "2027-03-20",
    returnDate: "2027-04-02",
    visibility: "public" as const,
    maxParticipants: 6,
    budget: "1850.00",
    description:
      "Tokio, Kioto y Osaka durante la primavera. Buscamos un grupo tranquilo que quiera combinar cultura, gastronomía y excursiones.",
  },
  {
    slug: "palma-portugal-enero-demo",
    title: "Viaje a Portugal",
    originAirportCode: "PMI",
    destinationCountryCode: "PT",
    departureDate: "2027-01-14",
    returnDate: "2027-01-18",
    visibility: "public" as const,
    maxParticipants: 4,
    budget: "480.00",
    description:
      "Escapada de cuatro días entre Lisboa y Sintra con tiempo para descubrir restaurantes y recorrer la costa.",
  },
];

let created = 0;
for (const [index, sample] of samples.entries()) {
  const [existing] = await database
    .select({ id: trips.id })
    .from(trips)
    .where(eq(trips.slug, sample.slug))
    .limit(1);
  if (existing) continue;

  const originAirportId = airportByIata.get(sample.originAirportCode);
  if (!originAirportId)
    throw new Error(`No se encuentra el aeropuerto ${sample.originAirportCode}.`);
  const creator = creators[index % creators.length]!;
  const [trip] = await database
    .insert(trips)
    .values({
      creatorId: creator.id,
      title: sample.title,
      slug: sample.slug,
      originCountryCode: "ES",
      originAirportId,
      destinationCountryCode: sample.destinationCountryCode,
      departureDate: sample.departureDate,
      returnDate: sample.returnDate,
      visibility: sample.visibility,
      status: "published",
      maxParticipants: sample.maxParticipants,
      budget: sample.budget,
      description: sample.description,
    })
    .returning({ id: trips.id });
  if (!trip) throw new Error(`No se ha podido crear ${sample.slug}.`);
  await database.insert(conversations).values({ tripId: trip.id });
  created += 1;
  console.log(`Creado ${sample.slug} para @${creator.username}.`);
}

console.log(`Viajes de muestra: ${created} creados, ${samples.length - created} existentes.`);
process.exit(0);
