import { parse } from "csv-parse";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

import { createDatabase } from "./client";
import { airports, countries, locationCatalogImports } from "./schema";

type CountryCsvRow = {
  code: string;
  name: string;
  continent: string;
  keywords: string;
};

type AirportCsvRow = {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  iso_country: string;
  municipality: string;
  scheduled_service: string;
  gps_code: string;
  icao_code: string;
  iata_code: string;
  keywords: string;
};

const acceptedAirportTypes = new Set([
  "large_airport",
  "medium_airport",
  "small_airport",
  "seaplane_base",
]);
const dataDirectory = fileURLToPath(new URL("../data/", import.meta.url));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl)
  throw new Error("DATABASE_URL es obligatoria para importar ubicaciones.");

const database = createDatabase(databaseUrl);
const catalogLocales = ["es", "en", "ca", "fr", "de", "it", "pt", "nl"];
const displayNames = new Map(
  catalogLocales.map((locale) => [
    locale,
    new Intl.DisplayNames([locale], { type: "region" }),
  ]),
);
const countryNames = new Map<
  string,
  { name: string; nameEs: string; localizedNames: string[] }
>();

const checksum = createHash("sha256")
  .update("i18n-v1")
  .update(await readFile(`${dataDirectory}countries.csv`))
  .update(await readFile(`${dataDirectory}airports.csv`))
  .digest("hex");
const [previousImport] = await database
  .select({ checksum: locationCatalogImports.checksum })
  .from(locationCatalogImports)
  .where(sql`${locationCatalogImports.dataset} = 'ourairports'`)
  .limit(1);

if (previousImport?.checksum === checksum) {
  console.log("El catálogo mundial de ubicaciones ya está actualizado.");
  process.exit(0);
}

async function seedCountries() {
  const values = [];
  for await (const row of readCsv<CountryCsvRow>(
    `${dataDirectory}countries.csv`,
  )) {
    const localizedNames = [...displayNames.values()].map(
      (names) => names.of(row.code) ?? row.name,
    );
    const nameEs = localizedNames[0] ?? row.name;
    countryNames.set(row.code, { name: row.name, nameEs, localizedNames });
    values.push({
      code: row.code,
      name: row.name,
      nameEs,
      continentCode: row.continent,
      keywords: emptyToNull(row.keywords),
      searchText: normalizeSearchText(
        `${row.code} ${row.name} ${localizedNames.join(" ")} ${row.keywords}`,
      ),
      airportCount: 0,
    });
  }

  await database
    .insert(countries)
    .values(values)
    .onConflictDoUpdate({
      target: countries.code,
      set: {
        name: sql`excluded.name`,
        nameEs: sql`excluded.name_es`,
        continentCode: sql`excluded.continent_code`,
        keywords: sql`excluded.keywords`,
        searchText: sql`excluded.search_text`,
      },
    });
  return values.length;
}

async function seedAirports() {
  let batch = [];
  let total = 0;

  for await (const row of readCsv<AirportCsvRow>(
    `${dataDirectory}airports.csv`,
  )) {
    if (!acceptedAirportTypes.has(row.type)) continue;
    const country = countryNames.get(row.iso_country);
    if (!country) continue;

    const latitude = Number(row.latitude_deg);
    const longitude = Number(row.longitude_deg);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const iataCode = emptyToNull(row.iata_code)?.toUpperCase() ?? null;
    const icaoCode =
      emptyToNull(row.icao_code || row.gps_code)?.toUpperCase() ?? null;
    const scheduledService = row.scheduled_service === "yes";
    batch.push({
      id: Number(row.id),
      ident: row.ident,
      type: row.type,
      name: row.name,
      municipality: emptyToNull(row.municipality),
      countryCode: row.iso_country,
      iataCode,
      icaoCode,
      latitude,
      longitude,
      scheduledService,
      keywords: emptyToNull(row.keywords),
      searchText: normalizeSearchText(
        [
          row.ident,
          iataCode,
          icaoCode,
          row.name,
          row.municipality,
          ...country.localizedNames,
          row.keywords,
        ]
          .filter(Boolean)
          .join(" "),
      ),
      priority:
        airportTypePriority(row.type) +
        (scheduledService ? 1_000 : 0) +
        (iataCode ? 500 : 0),
    });

    if (batch.length === 1_000) {
      await upsertAirports(batch);
      total += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await upsertAirports(batch);
    total += batch.length;
  }

  await database.execute(sql`
    update ${countries}
    set airport_count = counts.total
    from (
      select country_code, count(*)::integer as total
      from ${airports}
      group by country_code
    ) counts
    where ${countries.code} = counts.country_code
  `);
  return total;
}

async function upsertAirports(values: (typeof airports.$inferInsert)[]) {
  await database
    .insert(airports)
    .values(values)
    .onConflictDoUpdate({
      target: airports.id,
      set: {
        ident: sql`excluded.ident`,
        type: sql`excluded.type`,
        name: sql`excluded.name`,
        municipality: sql`excluded.municipality`,
        countryCode: sql`excluded.country_code`,
        iataCode: sql`excluded.iata_code`,
        icaoCode: sql`excluded.icao_code`,
        latitude: sql`excluded.latitude`,
        longitude: sql`excluded.longitude`,
        scheduledService: sql`excluded.scheduled_service`,
        keywords: sql`excluded.keywords`,
        searchText: sql`excluded.search_text`,
        priority: sql`excluded.priority`,
      },
    });
}

async function* readCsv<Row>(filename: string): AsyncGenerator<Row> {
  const parser = createReadStream(filename).pipe(
    parse({ columns: true, bom: true, relax_column_count: true }),
  );
  for await (const record of parser) yield record as Row;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function airportTypePriority(type: string) {
  if (type === "large_airport") return 300;
  if (type === "medium_airport") return 200;
  if (type === "small_airport") return 100;
  return 50;
}

const countryTotal = await seedCountries();
const airportTotal = await seedAirports();
await database
  .insert(locationCatalogImports)
  .values({ dataset: "ourairports", checksum, importedAt: new Date() })
  .onConflictDoUpdate({
    target: locationCatalogImports.dataset,
    set: { checksum, importedAt: new Date() },
  });
console.log(
  `Catálogo de ubicaciones actualizado: ${countryTotal} países y ${airportTotal} aeropuertos.`,
);
process.exit(0);
