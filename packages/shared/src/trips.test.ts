import { describe, expect, it } from "vitest";

import { searchTripsSchema, tripCardSchema, featuredTrips } from "./trips";

describe("trip contracts", () => {
  it("accepts a search without a destination", () => {
    const result = searchTripsSchema.parse({ origin: "Palma", travelers: "2" });
    expect(result).toEqual({ origin: "Palma", travelers: 2 });
  });

  it("keeps fixture cards aligned with the public contract", () => {
    expect(tripCardSchema.array().parse(featuredTrips)).toHaveLength(3);
  });
});
