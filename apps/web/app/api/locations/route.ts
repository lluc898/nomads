import { searchTravelLocations } from "@viajeroshub/database";
import {
  isSupportedLocale,
  locationSearchQuerySchema,
  travelLocationSchema,
} from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = locationSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    includeAnywhere: url.searchParams.get("includeAnywhere") ?? "false",
  });

  if (!parsed.success) {
    return Response.json({ message: "Búsqueda no válida." }, { status: 400 });
  }

  const requestedLocale = url.searchParams.get("locale");
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "es";

  const locations = await searchTravelLocations(getDatabase(), {
    query: parsed.data.q,
    includeAnywhere: false,
  });
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  const localized = locations.map((location) => {
    const countryName = location.countryCode
      ? displayNames.of(location.countryCode)
      : undefined;
    if (location.kind === "country") {
      const count = Number.parseInt(location.subtitle, 10);
      return {
        ...location,
        name: countryName ?? location.name,
        subtitle: airportCountLabel(locale, count),
      };
    }
    return {
      ...location,
      subtitle: `${location.subtitle.split(" · ")[0]} · ${countryName ?? location.countryCode}`,
    };
  });
  const anywhere = parsed.data.includeAnywhere
    ? [
        {
          id: "anywhere",
          kind: "anywhere" as const,
          name: anywhereLabels[locale][0],
          subtitle: anywhereLabels[locale][1],
          code: null,
          countryCode: null,
        },
      ]
    : [];

  return Response.json(
    travelLocationSchema.array().parse([...anywhere, ...localized]),
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

const anywhereLabels = {
  es: ["Cualquier lugar", "Explora todos los destinos"],
  en: ["Anywhere", "Explore every destination"],
  ca: ["Qualsevol lloc", "Explora totes les destinacions"],
  fr: ["Partout", "Explorez toutes les destinations"],
  de: ["Überall", "Alle Reiseziele entdecken"],
  it: ["Ovunque", "Esplora tutte le destinazioni"],
  pt: ["Qualquer lugar", "Explora todos os destinos"],
  nl: ["Overal", "Ontdek alle bestemmingen"],
} as const;

function airportCountLabel(locale: keyof typeof anywhereLabels, count: number) {
  const nouns = {
    es: "aeropuertos",
    en: "airports",
    ca: "aeroports",
    fr: "aéroports",
    de: "Flughäfen",
    it: "aeroporti",
    pt: "aeroportos",
    nl: "luchthavens",
  };
  return `${new Intl.NumberFormat(locale).format(count)} ${nouns[locale]}`;
}
