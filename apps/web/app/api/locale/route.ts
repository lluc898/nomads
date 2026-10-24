import { detectLocaleFromHeaders } from "@/lib/i18n/request-locale";

export async function GET(request: Request) {
  const locale = await detectLocaleFromHeaders(request.headers);
  return Response.json(
    { locale },
    { headers: { "Cache-Control": "private, max-age=86400" } },
  );
}
