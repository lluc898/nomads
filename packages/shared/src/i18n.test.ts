import { describe, expect, it } from "vitest";

import {
  isSupportedLocale,
  localeForCountry,
  localeFromLanguageHeader,
  translate,
} from "./i18n";

describe("internationalization", () => {
  it("maps countries to their default locale", () => {
    expect(localeForCountry("ES")).toBe("es");
    expect(localeForCountry("US")).toBe("en");
    expect(localeForCountry("FR")).toBe("fr");
    expect(localeForCountry("BR")).toBe("pt");
  });

  it("uses the first supported browser language", () => {
    expect(localeFromLanguageHeader("ja,en-US;q=0.9,es;q=0.8")).toBe("en");
    expect(localeFromLanguageHeader("fr-FR,fr;q=0.9")).toBe("fr");
  });

  it("validates locales and interpolates messages", () => {
    expect(isSupportedLocale("de")).toBe(true);
    expect(isSupportedLocale("ja")).toBe(false);
    expect(translate("en", "priceFrom", { price: 450 })).toBe("From €450");
  });
});
