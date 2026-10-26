import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_TTL_SECONDS = 10 * 60;

export function createTripLinkAccess(
  linkId: string,
  userId: string,
  secret: string,
) {
  const expires = Math.floor(Date.now() / 1_000) + ACCESS_TTL_SECONDS;
  const signature = sign(linkId, userId, expires, secret);
  return `${expires}.${userId}.${signature}`;
}

export function verifyTripLinkAccess(
  token: string | null,
  linkId: string,
  secret: string,
) {
  if (!token) return null;
  const [expiresValue, userId, provided] = token.split(".");
  const expires = Number(expiresValue);
  if (
    !Number.isInteger(expires) ||
    expires < Math.floor(Date.now() / 1_000) ||
    !userId ||
    !provided
  ) {
    return null;
  }
  const expected = sign(linkId, userId, expires, secret);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }
  return userId;
}

function sign(linkId: string, userId: string, expires: number, secret: string) {
  return createHmac("sha256", secret)
    .update(`${linkId}:${userId}:${expires}`)
    .digest("base64url");
}
