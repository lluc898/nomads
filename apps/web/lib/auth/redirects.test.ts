import { describe, expect, it } from "vitest";

import { getProfileSetupUrl, getSafeCallbackUrl } from "./redirects";

describe("getSafeCallbackUrl", () => {
  it("allows internal destinations", () => {
    expect(getSafeCallbackUrl("/viajes/turquia?tab=chat")).toBe(
      "/viajes/turquia?tab=chat",
    );
  });

  it.each([
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "\\example.com",
    undefined,
  ])("rejects an unsafe destination: %s", (destination) => {
    expect(getSafeCallbackUrl(destination)).toBe("/mis-viajes");
  });
});

describe("getProfileSetupUrl", () => {
  it("preserves a safe destination for after onboarding", () => {
    expect(getProfileSetupUrl("/viajes/turquia?tab=chat")).toBe(
      "/perfil?callbackUrl=%2Fviajes%2Fturquia%3Ftab%3Dchat",
    );
  });

  it("replaces external destinations with the safe fallback", () => {
    expect(getProfileSetupUrl("https://example.com")).toBe(
      "/perfil?callbackUrl=%2Fmis-viajes",
    );
  });
});
