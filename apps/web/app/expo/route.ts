import { readFile } from "node:fs/promises";

export const dynamic = "force-dynamic";

export async function GET() {
  const tunnelFile = process.env.EXPO_TUNNEL_FILE;
  if (!tunnelFile) return unavailable();

  const tunnelUrl = await readFile(tunnelFile, "utf8").catch(() => "");
  const match = tunnelUrl
    .trim()
    .match(/^https:\/\/([a-z0-9.-]+\.on\.expo\.app)$/);
  if (!match?.[1]) return unavailable();

  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: `exp://${match[1]}`,
    },
  });
}

function unavailable() {
  return Response.json(
    { message: "Expo se está reiniciando. Inténtalo de nuevo en un minuto." },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    },
  );
}
