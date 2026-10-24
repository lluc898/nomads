import {
  isSupportedLocale,
  localeForCountry,
  localeFromLanguageHeader,
  type SupportedLocale,
} from "@viajeroshub/shared";
import { cookies, headers } from "next/headers";
import { cache } from "react";

export const LOCALE_COOKIE = "viajeroshub_locale";

export const getRequestLocale = cache(async (): Promise<SupportedLocale> => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isSupportedLocale(savedLocale)) return savedLocale;
  return detectLocaleFromHeaders(await headers());
});

export async function detectLocaleFromHeaders(
  requestHeaders: Pick<Headers, "get">,
): Promise<SupportedLocale> {
  const providedCountry =
    requestHeaders.get("cf-ipcountry") ??
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("x-country-code");
  if (providedCountry?.length === 2) return localeForCountry(providedCountry);

  const ip = clientIp(requestHeaders);
  if (ip && !isPrivateIp(ip)) {
    try {
      const response = await fetch(
        `https://api.country.is/${encodeURIComponent(ip)}`,
        {
          signal: AbortSignal.timeout(1500),
          next: { revalidate: 86_400 },
        },
      );
      if (response.ok) {
        const payload = (await response.json()) as { country?: unknown };
        if (typeof payload.country === "string")
          return localeForCountry(payload.country);
      }
    } catch {
      // Browser language is a reliable fallback when GeoIP is unavailable.
    }
  }

  return localeFromLanguageHeader(requestHeaders.get("accept-language"));
}

function clientIp(requestHeaders: Pick<Headers, "get">) {
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded ?? requestHeaders.get("x-real-ip")?.trim() ?? null;
}

function isPrivateIp(ip: string) {
  const normalized = ip.replace(/^::ffff:/, "");
  return (
    normalized === "::1" ||
    normalized === "127.0.0.1" ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}
