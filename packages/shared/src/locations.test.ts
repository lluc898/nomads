import { describe, expect, it } from "vitest";

import { parseLocationId, travelRouteSchema } from "./locations";

describe("travelRouteSchema", () => {
  it("accepts countries, airports and anywhere as destination", () => {
    expect(
      travelRouteSchema.parse({
        origin: "airport:123",
        destination: "country:ES",
      }),
    ).toEqual({ origin: "airport:123", destination: "country:ES" });
    expect(
      travelRouteSchema.parse({
        origin: "country:ES",
        destination: "anywhere",
      }),
    ).toEqual({ origin: "country:ES", destination: "anywhere" });
  });

  it("does not allow anywhere as origin", () => {
    expect(
      travelRouteSchema.safeParse({
        origin: "anywhere",
        destination: "country:FR",
      }).success,
    ).toBe(false);
  });
});

describe("parseLocationId", () => {
  it("converts public ids to persistence references", () => {
    expect(parseLocationId("country:ES")).toEqual({
      kind: "country",
      countryCode: "ES",
    });
    expect(parseLocationId("airport:42")).toEqual({
      kind: "airport",
      airportId: 42,
    });
    expect(parseLocationId("anywhere")).toEqual({ kind: "anywhere" });
  });
});
