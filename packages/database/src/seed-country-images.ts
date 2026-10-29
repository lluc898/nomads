import { eq, isNull, or } from "drizzle-orm";

import { createDatabase } from "./client";
import { countries } from "./schema";

type MetadataValue = { value?: string };
type CommonsImageInfo = {
  width?: number;
  height?: number;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, MetadataValue>;
};
type CommonsPage = {
  title?: string;
  imageinfo?: CommonsImageInfo[];
};
type CommonsResponse = { query?: { pages?: CommonsPage[] } };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL es obligatoria para importar imÃ¡genes.");

const database = createDatabase(databaseUrl);
const missingCountries = await database
  .select({ code: countries.code, name: countries.name })
  .from(countries)
  .where(
    or(
      isNull(countries.heroImageUrl),
      isNull(countries.heroImageSourceUrl),
      isNull(countries.heroImageLicense),
    ),
  );

const searchOverrides: Record<string, string> = {
  CD: "Democratic Republic of the Congo landscape",
  CG: "Republic of the Congo landscape",
  GE: "Georgia country Caucasus landscape",
  JO: "Jordan country landscape",
  NE: "Niger country landscape",
  TR: "Landscapes of Turkey",
};
const allowedLicense = /^(CC0|CC BY(?:-SA)?(?: |$)|Public domain)/i;
let imported = 0;
let failed = 0;
let cursor = 0;

async function worker() {
  while (cursor < missingCountries.length) {
    const country = missingCountries[cursor++];
    if (!country) return;
    try {
      const image = await findCountryImage(country.code, country.name);
      if (!image) {
        failed += 1;
        console.warn(`Sin imagen libre para ${country.code} ${country.name}.`);
        continue;
      }
      await database
        .update(countries)
        .set({
          heroImageUrl: image.url,
          heroImageSourceUrl: image.sourceUrl,
          heroImageAuthor: image.author.slice(0, 255),
          heroImageLicense: image.license.slice(0, 64),
          heroImageLicenseUrl: image.licenseUrl,
          heroImageAlt: `Paisaje de ${country.name}`.slice(0, 255),
          heroImageUpdatedAt: new Date(),
        })
        .where(eq(countries.code, country.code));
      imported += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `No se pudo importar ${country.code}: ${error instanceof Error ? error.message : "Error"}`,
      );
    }
  }
}

async function findCountryImage(code: string, name: string) {
  const queries = [
    searchOverrides[code] ?? `${name} country landscape travel`,
    `${name} scenery landscape`,
    `${name} country tourism`,
  ];
  for (const query of queries) {
    const candidates = await searchCommons(query);
    const selected = candidates
      .filter((candidate) => candidate.license.match(allowedLicense))
      .filter((candidate) => candidate.width >= candidate.height * 1.25)
      .sort((left, right) => right.score - left.score)[0];
    if (selected) return selected;
  }
  return null;
}

async function searchCommons(query: string) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1280",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    {
      headers: {
        "User-Agent":
          "ViajerosHub/1.0 (https://viajes.llucbosch.com; country image catalog)",
      },
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) throw new Error(`Commons HTTP ${response.status}`);
  const payload = (await response.json()) as CommonsResponse;
  return (payload.query?.pages ?? []).flatMap((page) => {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata;
    const license = metadata?.LicenseShortName?.value?.trim();
    const author = cleanText(
      metadata?.Attribution?.value ?? metadata?.Artist?.value,
    );
    const url = info?.thumburl;
    const sourceUrl = info?.descriptionurl;
    const width = info?.width ?? 0;
    const height = info?.height ?? 0;
    if (!url || !sourceUrl || !license || !author || !width || !height)
      return [];
    const categories = metadata?.Categories?.value ?? "";
    const assessments = metadata?.Assessments?.value ?? "";
    const ratio = width / height;
    const score =
      (categories.toLowerCase().includes("landscape") ? 5 : 0) +
      (assessments.match(/featured|quality/i) ? 3 : 0) +
      (license.match(/^CC0|Public domain/i) ? 2 : 0) -
      Math.abs(ratio - 1.6);
    return [
      {
        url,
        sourceUrl,
        author,
        license,
        licenseUrl: metadata?.LicenseUrl?.value ?? null,
        width,
        height,
        score,
      },
    ];
  });
}

function cleanText(value?: string) {
  if (!value) return null;
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
console.log(
  `ImÃ¡genes de paÃ­ses: ${imported} importadas, ${failed} pendientes, ${missingCountries.length} revisadas.`,
);
process.exit(0);
