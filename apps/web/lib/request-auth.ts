import { auth } from "@/auth";
import { getBearerToken, requireMobileAuth } from "@/lib/mobile-auth";

export async function authenticatedUserId(request: Request) {
  if (getBearerToken(request)) {
    return (await requireMobileAuth(request))?.user.id ?? null;
  }
  return (await auth())?.user?.id ?? null;
}
