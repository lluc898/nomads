import { searchTravelLocations } from "@viajeroshub/database";
import {
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

  const locations = await searchTravelLocations(getDatabase(), {
    query: parsed.data.q,
    includeAnywhere: parsed.data.includeAnywhere,
  });

  return Response.json(travelLocationSchema.array().parse(locations), {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
