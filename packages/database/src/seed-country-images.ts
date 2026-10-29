import { eq } from "drizzle-orm";

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
type WikidataResponse = {
  results?: {
    bindings?: Array<{
      code?: { value?: string };
      image?: { value?: string };
    }>;
  };
};
type CountryImage = Awaited<ReturnType<typeof searchCommons>>[number];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL es obligatoria para importar imÃ¡genes.");

const database = createDatabase(databaseUrl);
const refreshAll = process.env.REFRESH_COUNTRY_IMAGES === "true";
const countrySelection = {
  code: countries.code,
  name: countries.name,
  heroImageUrl: countries.heroImageUrl,
  heroImageSourceUrl: countries.heroImageSourceUrl,
  heroImageLicense: countries.heroImageLicense,
};
const allCountries = await database.select(countrySelection).from(countries);
const missingCountries = refreshAll
  ? allCountries
  : allCountries.filter(
      (country) =>
        !country.heroImageUrl ||
        !country.heroImageSourceUrl ||
        !country.heroImageLicense ||
        isNonScenicSource(country.heroImageSourceUrl),
    );

const searchOverrides: Record<string, string> = {
  BA: "Bosnia landscape",
  BL: "Saint Barthelemy island landscape",
  CD: "Democratic Republic of the Congo landscape",
  CG: "Republic of the Congo landscape",
  DM: "Nature of Dominica",
  EH: "Western Sahara landscape",
  GF: "French Guiana landscape",
  GE: "Georgia country Caucasus landscape",
  GP: "Guadeloupe island landscape",
  HM: "Heard Island landscape",
  IM: "Isle of Man landscape",
  IO: "Chagos Archipelago landscape",
  IQ: "Iraq landscape",
  JO: "Jordan country landscape",
  KN: "Saint Kitts Nevis landscape",
  LV: "Latvia landscape",
  MH: "Marshall Islands landscape",
  MQ: "Martinique island landscape",
  NC: "New Caledonia landscape",
  NE: "Niger country landscape",
  NR: "Nauru island landscape",
  PM: "Saint Pierre Miquelon landscape",
  PS: "Palestine landscape",
  RE: "Reunion island landscape",
  SH: "Saint Helena island landscape",
  SM: "San Marino landscape",
  SR: "Suriname nature",
  SS: "South Sudan landscape",
  ST: "Sao Tome landscape",
  SZ: "Eswatini landscape",
  TF: "Kerguelen Islands landscape",
  TR: "Landscapes of Turkey",
  VC: "Saint Vincent Grenadines landscape",
  VU: "Vanuatu landscape",
  XP: "Paracel Islands landscape",
  YE: "Yemen landscape",
  YT: "Mayotte island landscape",
  ZW: "Zimbabwe landscape",
};
const allowedLicense = /^(CC0|CC BY(?:-SA)?(?: |$)|Public domain)/i;
let imported = 0;
let failed = 0;
let cursor = 0;
let nextCommonsRequestAt = 0;
const wikidataImages = await loadWikidataCountryImages(
  new Set(missingCountries.map((country) => country.code)),
);

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
  const representative = wikidataImages.get(code);
  if (representative) return representative;
  if (refreshAll) return null;

  const queries = [
    searchOverrides[code] ?? `${name} country landscape travel`,
    `${name} scenery landscape`,
    `${name} country tourism`,
  ];
  for (const query of queries) {
    const candidates = await searchCommons(query);
    const selected = candidates
      .filter((candidate) => candidate.license.match(allowedLicense))
      .filter(isScenicCandidate)
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
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1280",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetchCommonsWithRetry(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  );
  const payload = (await response.json()) as CommonsResponse;
  return parseCommonsPages(payload.query?.pages ?? []);
}

async function loadWikidataCountryImages(countryCodes: Set<string>) {
  const sparql = `SELECT ?code ?image WHERE {
    ?item wdt:P297 ?code; wdt:P18 ?image.
    FILTER(STRLEN(?code) = 2)
  }`;
  const params = new URLSearchParams({ query: sparql, format: "json" });
  const response = await fetch(`https://query.wikidata.org/sparql?${params}`, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent":
        "ViajerosHub/1.0 (https://viajes.llucbosch.com; country image catalog; contact: webmaster@llucbosch.com)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}`);

  const payload = (await response.json()) as WikidataResponse;
  const codesByFile = new Map<string, Set<string>>();
  const originalFiles = new Map<string, string>();
  for (const binding of payload.results?.bindings ?? []) {
    const code = binding.code?.value?.toUpperCase();
    const imageUrl = binding.image?.value;
    if (!code || !countryCodes.has(code) || !imageUrl) continue;
    const fileName = decodeURIComponent(imageUrl.split("/").pop() ?? "");
    if (!fileName) continue;
    const normalized = normalizeFileName(fileName);
    originalFiles.set(normalized, fileName);
    const codes = codesByFile.get(normalized) ?? new Set<string>();
    codes.add(code);
    codesByFile.set(normalized, codes);
  }

  const files = [...codesByFile.keys()];
  const candidatesByCode = new Map<string, CountryImage[]>();
  for (let index = 0; index < files.length; index += 40) {
    const batch = files.slice(index, index + 40);
    const commonsParams = new URLSearchParams({
      action: "query",
      titles: batch
        .map((file) => `File:${originalFiles.get(file) ?? file}`)
        .join("|"),
      prop: "imageinfo",
      iiprop: "url|size|extmetadata",
      iiurlwidth: "1280",
      redirects: "1",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    const commonsResponse = await fetchCommonsWithRetry(
      `https://commons.wikimedia.org/w/api.php?${commonsParams}`,
    );
    const commonsPayload = (await commonsResponse.json()) as CommonsResponse;
    for (const page of commonsPayload.query?.pages ?? []) {
      const file = normalizeFileName(page.title?.replace(/^File:/i, "") ?? "");
      const codes = codesByFile.get(file);
      const candidate = parseCommonsPages([page])[0];
      if (!codes || !candidate) continue;
      for (const code of codes) {
        const candidates = candidatesByCode.get(code) ?? [];
        candidates.push(candidate);
        candidatesByCode.set(code, candidates);
      }
    }
  }

  const selected = new Map<string, CountryImage>();
  for (const [code, candidates] of candidatesByCode) {
    const licensed = candidates
      .filter((candidate) => candidate.license.match(allowedLicense))
      .filter(isScenicCandidate)
      .sort((left, right) => right.score - left.score);
    const image =
      licensed.find((candidate) => candidate.width >= candidate.height * 1.2) ??
      licensed[0];
    if (image) selected.set(code, image);
  }
  return selected;
}

function parseCommonsPages(pages: CommonsPage[]) {
  return pages.flatMap((page) => {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata;
    const license = metadata?.LicenseShortName?.value?.trim();
    const author =
      cleanText(metadata?.Attribution?.value) ||
      cleanText(metadata?.Artist?.value) ||
      cleanText(metadata?.Credit?.value);
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

function normalizeFileName(value: string) {
  return value.replace(/_/g, " ").trim().toLowerCase();
}

function isScenicCandidate(candidate: CountryImage) {
  return !isNonScenicSource(candidate.sourceUrl);
}

function isNonScenicSource(sourceUrl: string) {
  let normalized = sourceUrl.toLowerCase();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // La URL original sigue siendo suficiente para aplicar los filtros.
  }
  return (
    normalized.endsWith(".svg") ||
    /(?:^|[\s_\-/])(map|flag|coat[\s_-]+of[\s_-]+arms|satellite|orthographic|locator|location[\s_-]+map|blank[\s_-]+map|relief[\s_-]+map|administrative)(?:[\s_\-/.]|$)/i.test(
      normalized,
    )
  );
}

async function fetchCommonsWithRetry(url: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const waitForTurn = Math.max(0, nextCommonsRequestAt - Date.now());
    if (waitForTurn) await delay(waitForTurn);
    nextCommonsRequestAt = Date.now() + 450;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "ViajerosHub/1.0 (https://viajes.llucbosch.com; country image catalog; contact: webmaster@llucbosch.com)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500)
      throw new Error(`Commons HTTP ${response.status}`);

    const retryAfter = Number(response.headers.get("retry-after"));
    const backoff = Number.isFinite(retryAfter)
      ? retryAfter * 1_000
      : Math.min(30_000, 2_000 * 2 ** attempt);
    await delay(backoff + Math.floor(Math.random() * 500));
  }
  throw new Error("Commons sigue limitando las solicitudes tras 6 reintentos");
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

await worker();
console.log(
  `ImÃ¡genes de paÃ­ses: ${imported} importadas, ${failed} pendientes, ${missingCountries.length} revisadas.`,
);
process.exit(0);
