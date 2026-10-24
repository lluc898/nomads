import { describe, expect, it } from "vitest";

import { searchTripsSchema, tripCardSchema, featuredTrips } from "./trips";

describe("trip contracts", () => {
  it("accepts exact departure and return dates without travelers", () => {
    const result = searchTripsSchema.parse({
      origin: "airport:123",
      dateMode: "exact",
      departureDate: "2027-04-10",
      returnDate: "2027-04-18",
    });
    expect(result).toEqual({
      origin: "airport:123",
      dateMode: "exact",
      departureDate: "2027-04-10",
      returnDate: "2027-04-18",
    });
  });

  it("accepts a whole flexible month", () => {
    expect(
      searchTripsSchema.parse({
        destination: "anywhere",
        dateMode: "flexible",
        flexibleMonth: "2027-08",
      }),
    ).toMatchObject({ flexibleMonth: "2027-08" });
  });

  it("rejects a return date before departure", () => {
    expect(() =>
      searchTripsSchema.parse({
        dateMode: "exact",
        departureDate: "2027-04-18",
        returnDate: "2027-04-10",
      }),
    ).toThrow();
  });

  it("keeps fixture cards aligned with the public contract", () => {
    expect(tripCardSchema.array().parse(featuredTrips)).toHaveLength(3);
  });
});
