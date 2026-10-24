import { revokeMobileAuth } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  await revokeMobileAuth(request);
  return new Response(null, { status: 204 });
}
