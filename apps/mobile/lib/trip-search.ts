import {
  travelLocationSchema,
  tripDateSelectionSchema,
  type TravelLocation,
  type TripDateSelection,
} from "@viajeroshub/shared";

export type TripSearchSelection = {
  origin: TravelLocation;
  destination: TravelLocation;
  dates: TripDateSelection;
};

type RouteParams = Record<string, string | string[] | undefined>;

export function serializeTripSearch(search: TripSearchSelection) {
  return {
    origin: JSON.stringify(search.origin),
    destination: JSON.stringify(search.destination),
    dates: JSON.stringify(search.dates),
  };
}

export function parseTripSearch(params: RouteParams): TripSearchSelection | null {
  const parsedOrigin = travelLocationSchema.safeParse(parseJsonParam(params.origin));
  const parsedDestination = travelLocationSchema.safeParse(
    parseJsonParam(params.destination),
  );
  const parsedDates = tripDateSelectionSchema.safeParse(
    parseJsonParam(params.dates),
  );
  if (!parsedOrigin.success || !parsedDestination.success || !parsedDates.success)
    return null;
  return {
    origin: parsedOrigin.data,
    destination: parsedDestination.data,
    dates: parsedDates.data,
  };
}

function parseJsonParam(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
