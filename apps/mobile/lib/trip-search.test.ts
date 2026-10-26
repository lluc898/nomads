import { describe, expect, it } from "vitest";

import { parseTripSearch, serializeTripSearch } from "./trip-search";

const search = {
  origin: {
    id: "country:ES",
    kind: "country" as const,
    name: "España",
    subtitle: "174 aeropuertos",
    code: "ES",
    countryCode: "ES",
  },
  destination: {
    id: "anywhere",
    kind: "anywhere" as const,
    name: "Cualquier lugar",
    subtitle: "Explora todos los destinos",
    code: null,
    countryCode: null,
  },
  dates: {
    dateMode: "flexible" as const,
    flexibleMonth: "2027-06",
  },
};

describe("trip search route params", () => {
  it("preserves the complete search selection", () => {
    expect(parseTripSearch(serializeTripSearch(search))).toEqual(search);
  });

  it("rejects incomplete or malformed route params", () => {
    expect(parseTripSearch({ origin: "not-json" })).toBeNull();
  });
});
