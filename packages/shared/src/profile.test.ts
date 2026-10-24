import { describe, expect, it } from "vitest";

import {
  normalizeInstagramUrl,
  profileInputSchema,
  usernameSchema,
} from "./profile";

describe("usernameSchema", () => {
  it("normalizes usernames", () => {
    expect(usernameSchema.parse("  Lluc_Bosch ")).toBe("lluc_bosch");
  });

  it("rejects spaces and symbols", () => {
    expect(usernameSchema.safeParse("lluc bosch").success).toBe(false);
    expect(usernameSchema.safeParse("lluc-bosch").success).toBe(false);
    expect(usernameSchema.safeParse("@ab").success).toBe(false);
  });
});

describe("normalizeInstagramUrl", () => {
  it.each([
    ["lluc.bosch", "https://www.instagram.com/lluc.bosch/"],
    ["@lluc_bosch", "https://www.instagram.com/lluc_bosch/"],
    [
      "https://instagram.com/lluc.bosch/",
      "https://www.instagram.com/lluc.bosch/",
    ],
    ["", null],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeInstagramUrl(input)).toBe(expected);
  });

  it("rejects non-Instagram and nested URLs", () => {
    expect(() => normalizeInstagramUrl("https://example.com/lluc")).toThrow();
    expect(() =>
      normalizeInstagramUrl("https://instagram.com/p/publication"),
    ).toThrow();
  });
});

describe("profileInputSchema", () => {
  it("validates the editable text fields", () => {
    const result = profileInputSchema.safeParse({
      username: "viajero_1",
      instagram: "@viajero.1",
    });

    expect(result.success).toBe(true);
  });
});
