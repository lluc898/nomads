import { sql } from "drizzle-orm";

import type { Database } from "./client";

type LocationRow = {
  id: string;
  kind: "country" | "airport";
  name: string;
  subtitle: string;
  code: string | null;
  countryCode: string | null;
};

export async function searchTravelLocations(
  database: Database,
  input: { query: string; includeAnywhere: boolean; limit?: number },
) {
  const query = normalizeSearchText(input.query);
  const limit = Math.min(Math.max(input.limit ?? 12, 1), 20);
  const anywhere = input.includeAnywhere
    ? [
        {
          id: "anywhere",
          kind: "anywhere" as const,
          name: "Cualquier lugar",
          subtitle: "Explora todos los destinos",
          code: null,
          countryCode: null,
        },
      ]
    : [];

  if (!query) return anywhere;
  const pattern = `%${query}%`;
  const prefix = `${query}%`;

  const result = await database.execute<LocationRow>(sql`
    with matching_locations as (
      select
        'country:' || code as id,
        'country' as kind,
        name_es as name,
        airport_count || ' aeropuertos' as subtitle,
        code,
        code as country_code,
        case
          when lower(code) = ${query} then 10000
          when search_text = ${query} then 9000
          when search_text like ${`% ${query} %`}
            or search_text like ${`% ${query}`} then 8000
          when search_text like ${prefix} then 7000
          else 2000
        end + least(airport_count, 500) as score
      from countries
      where search_text like ${pattern}

      union all

      select
        'airport:' || airports.id as id,
        'airport' as kind,
        case
          when airports.municipality is not null then
            airports.municipality || ' (' || coalesce(airports.iata_code, airports.ident) || ')'
          else airports.name || ' (' || coalesce(airports.iata_code, airports.ident) || ')'
        end as name,
        airports.name || ' · ' || countries.name_es as subtitle,
        coalesce(airports.iata_code, airports.icao_code, airports.ident) as code,
        airports.country_code,
        case
          when lower(coalesce(airports.iata_code, '')) = ${query} then 10000
          when lower(coalesce(airports.icao_code, '')) = ${query} then 9900
          when lower(airports.ident) = ${query} then 9800
          when lower(coalesce(airports.municipality, '')) = ${query} then 5000
          when airports.search_text like ${`% ${query} %`}
            or airports.search_text like ${`% ${query}`} then 5000
          when airports.search_text like ${prefix} then 4500
          else 2000
        end + airports.priority as score
      from airports
      inner join countries on countries.code = airports.country_code
      where airports.search_text like ${pattern}
    )
    select id, kind, name, subtitle, code, country_code as "countryCode"
    from matching_locations
    order by score desc, name asc
    limit ${limit}
  `);

  return [...anywhere, ...result];
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
