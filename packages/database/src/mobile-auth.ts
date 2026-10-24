import { and, eq, gt } from "drizzle-orm";

import type { Database } from "./client";
import { mobileAuthCodes, mobileSessions, users } from "./schema";

export async function createMobileAuthCode(
  database: Database,
  input: {
    codeHash: string;
    userId: string;
    pkceChallenge: string;
    expiresAt: Date;
  },
) {
  await database.insert(mobileAuthCodes).values(input);
}

export async function exchangeMobileAuthCode(
  database: Database,
  input: {
    codeHash: string;
    pkceChallenge: string;
    tokenHash: string;
    sessionExpiresAt: Date;
  },
) {
  return database.transaction(async (transaction) => {
    const [authorizationCode] = await transaction
      .delete(mobileAuthCodes)
      .where(
        and(
          eq(mobileAuthCodes.codeHash, input.codeHash),
          eq(mobileAuthCodes.pkceChallenge, input.pkceChallenge),
          gt(mobileAuthCodes.expiresAt, new Date()),
        ),
      )
      .returning({ userId: mobileAuthCodes.userId });

    if (!authorizationCode) {
      return null;
    }

    await transaction.insert(mobileSessions).values({
      tokenHash: input.tokenHash,
      userId: authorizationCode.userId,
      expiresAt: input.sessionExpiresAt,
    });

    return authorizationCode.userId;
  });
}

export async function getUserByMobileSession(
  database: Database,
  tokenHash: string,
) {
  const [user] = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      username: users.username,
      instagramUrl: users.instagramUrl,
    })
    .from(mobileSessions)
    .innerJoin(users, eq(mobileSessions.userId, users.id))
    .where(
      and(
        eq(mobileSessions.tokenHash, tokenHash),
        gt(mobileSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return user ?? null;
}

export async function deleteMobileSession(
  database: Database,
  tokenHash: string,
) {
  await database
    .delete(mobileSessions)
    .where(eq(mobileSessions.tokenHash, tokenHash));
}
