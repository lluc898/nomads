import { describe, expect, it } from "vitest";

import {
  createTripInputSchema,
  featuredTrips,
  searchTripsSchema,
  tripCardSchema,
  tripDetailSchema,
} from "./trips";

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

  it("accepts exact routes with typed booking links", () => {
    const result = createTripInputSchema.parse({
      origin: "airport:1",
      destination: "country:FR",
      departureDate: "2027-06-10",
      returnDate: "2027-06-17",
      description: "Una semana por la costa.",
      visibility: "public",
      budget: 850,
      maxParticipants: 4,
      links: [
        {
          name: "Vuelo desde Palma",
          type: "flight",
          url: "https://example.com/flight",
        },
      ],
    });
    expect(result.links[0]?.type).toBe("flight");
  });

  it("rejects unsafe links and identical locations", () => {
    expect(
      createTripInputSchema.safeParse({
        origin: "airport:1",
        destination: "airport:1",
        departureDate: "2027-06-10",
        returnDate: "2027-06-17",
        links: [{ name: "Enlace", type: "flight", url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });

  it("accepts a native-safe trip detail without provider URLs", () => {
    const detail = tripDetailSchema.parse({
      id: "48fdfc49-3ae4-4dd6-a053-a05e37bb0692",
      slug: "palma-paris",
      origin: "Palma de Mallorca (PMI)",
      destination: "París (CDG)",
      departureDate: "2027-06-10",
      returnDate: "2027-06-17",
      description: "Una semana en París.",
      visibility: "public",
      budget: 850,
      currency: "EUR",
      maxParticipants: 4,
      availablePlaces: 3,
      isFull: false,
      canViewPrivateContent: true,
      viewerMembershipStatus: "none",
      creator: { name: "Lluc", username: "lluc" },
      links: [
        {
          id: "860d88cc-b251-47f5-bc25-93694a854b4d",
          name: "Vuelo desde Palma",
          type: "flight",
          href: "/go/860d88cc-b251-47f5-bc25-93694a854b4d",
        },
      ],
      participants: [],
      pendingRequests: [],
    });
    expect(detail.links[0]).toEqual({
      id: "860d88cc-b251-47f5-bc25-93694a854b4d",
      name: "Vuelo desde Palma",
      type: "flight",
      href: "/go/860d88cc-b251-47f5-bc25-93694a854b4d",
    });
  });
});
