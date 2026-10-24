export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://viajes.llucbosch.com/api"
).replace(/\/$/, "");

export const WEB_URL = API_URL.replace(/\/api$/, "");

export function absoluteMediaUrl(url: string | null) {
  if (!url) return null;
  return url.startsWith("/") ? `${WEB_URL}${url}` : url;
}
