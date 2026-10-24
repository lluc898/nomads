import {
  deleteMobileSession,
  getUserByMobileSession,
} from "@viajeroshub/database";
import { createHash, randomBytes } from "node:crypto";

import { getDatabase } from "@/lib/database";

export const MOBILE_SESSION_DAYS = 30;

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function isValidPkceChallenge(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

export function getSafeMobileReturnUrl(value: string | null) {
  if (!value || value.length > 1_000) return null;

  try {
    const url = new URL(value);
    if (["viajeroshub:", "exp:", "exps:"].includes(url.protocol)) {
      return url;
    }
    if (
      url.protocol === "https:" &&
      (url.hostname === "on.expo.app" || url.hostname.endsWith(".on.expo.app"))
    ) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{40,100})$/);
  return match?.[1] ?? null;
}

export async function requireMobileAuth(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const user = await getUserByMobileSession(getDatabase(), sha256(token));
  return user ? { token, user } : null;
}

export async function revokeMobileAuth(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    await deleteMobileSession(getDatabase(), sha256(token));
  }
}
