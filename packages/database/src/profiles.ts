import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "./client";
import { users } from "./schema";

const publicProfileSelection = {
  id: users.id,
  name: users.name,
  username: users.username,
  image: users.image,
  instagramUrl: users.instagramUrl,
  createdAt: users.createdAt,
};

export type UserProfile = Awaited<ReturnType<typeof getUserProfileById>>;

export async function getUserProfileById(database: Database, userId: string) {
  const [profile] = await database
    .select(publicProfileSelection)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return profile ?? null;
}

export async function getUserProfileByUsername(
  database: Database,
  username: string,
) {
  const [profile] = await database
    .select(publicProfileSelection)
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return profile ?? null;
}

export async function isUsernameAvailable(
  database: Database,
  username: string,
) {
  const profile = await getUserProfileByUsername(database, username);
  return profile === null;
}

type UpdateUserProfileInput = {
  userId: string;
  currentUsername: string | null;
  username: string;
  imageUrl: string;
  instagramUrl: string | null;
};

export async function updateUserProfile(
  database: Database,
  input: UpdateUserProfileInput,
) {
  const usernameCondition = input.currentUsername
    ? eq(users.username, input.currentUsername)
    : isNull(users.username);

  const [profile] = await database
    .update(users)
    .set({
      username: input.username,
      image: input.imageUrl,
      instagramUrl: input.instagramUrl,
    })
    .where(and(eq(users.id, input.userId), usernameCondition))
    .returning(publicProfileSelection);

  return profile ?? null;
}
