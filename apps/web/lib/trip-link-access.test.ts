import { describe, expect, it } from "vitest";

import { createTripLinkAccess, verifyTripLinkAccess } from "./trip-link-access";

describe("private trip link access", () => {
  it("accepts a signed access token only for its link", () => {
    const linkId = "38fa5d4f-e245-4cf6-959f-6a5cf0bd119a";
    const userId = "169c461c-95c7-4ac3-9a2b-5e04937a7104";
    const token = createTripLinkAccess(linkId, userId, "test-secret");

    expect(verifyTripLinkAccess(token, linkId, "test-secret")).toBe(userId);
    expect(
      verifyTripLinkAccess(
        token,
        "85ede94b-e2eb-40c5-ac46-9b63caddff40",
        "test-secret",
      ),
    ).toBeNull();
  });

  it("rejects altered access tokens", () => {
    const linkId = "38fa5d4f-e245-4cf6-959f-6a5cf0bd119a";
    const token = createTripLinkAccess(
      linkId,
      "169c461c-95c7-4ac3-9a2b-5e04937a7104",
      "test-secret",
    );
    expect(
      verifyTripLinkAccess(`${token}altered`, linkId, "test-secret"),
    ).toBeNull();
  });
});
