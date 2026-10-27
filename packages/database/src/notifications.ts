import type {
  AppNotification,
  NotificationType,
  SupportedLocale,
} from "@viajeroshub/shared";
import { and, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database } from "./client";
import {
  notifications,
  pushDevices,
  tripNotificationPreferences,
  tripParticipants,
  trips,
  users,
} from "./schema";

const notificationSubscribers = new Map<string, Set<() => void>>();
let notificationListener: ReturnType<Database["$client"]["listen"]> | null =
  null;

export async function listUserNotifications(
  database: Database,
  userId: string,
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const actor = alias(users, "notification_actor");
  const rows = await database
    .select({
      id: notifications.id,
      type: notifications.type,
      tripSlug: trips.slug,
      tripTitle: trips.title,
      actorName: actor.name,
      actorUsername: actor.username,
      actorImage: actor.image,
      requestId: notifications.joinRequestId,
      preview: notifications.preview,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(trips, eq(trips.id, notifications.tripId))
    .leftJoin(actor, eq(actor.id, notifications.actorId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const [unread] = await database
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return {
    notifications: rows.map((row) => ({
      ...row,
      isRead: Boolean(row.readAt),
      createdAt: row.createdAt.toISOString(),
    })),
    unreadCount: Number(unread?.value ?? 0),
  };
}

export async function countUnreadNotifications(
  database: Database,
  userId: string,
) {
  const [row] = await database
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(row?.value ?? 0);
}

export async function markUserNotificationsRead(
  database: Database,
  userId: string,
  input: { notificationId?: string; all?: true },
) {
  await database
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      input.notificationId
        ? and(
            eq(notifications.userId, userId),
            eq(notifications.id, input.notificationId),
          )
        : and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  await publishNotificationUsers(database, [userId]);
}

export async function registerPushDevice(
  database: Database,
  input: {
    userId: string;
    token: string;
    platform: "ios" | "android";
    locale: SupportedLocale;
  },
) {
  await database
    .insert(pushDevices)
    .values({
      userId: input.userId,
      expoPushToken: input.token,
      platform: input.platform,
      locale: input.locale,
    })
    .onConflictDoUpdate({
      target: pushDevices.expoPushToken,
      set: {
        userId: input.userId,
        platform: input.platform,
        locale: input.locale,
        updatedAt: new Date(),
      },
    });
}

export async function removePushDevice(
  database: Database,
  userId: string,
  token: string,
) {
  await database
    .delete(pushDevices)
    .where(
      and(eq(pushDevices.userId, userId), eq(pushDevices.expoPushToken, token)),
    );
}

export async function getTripNotificationPreferences(
  database: Database,
  userId: string,
  slug: string,
) {
  const trip = await requireTripMember(database, userId, slug);
  const [preference] = await database
    .select({ chatMuted: tripNotificationPreferences.chatMuted })
    .from(tripNotificationPreferences)
    .where(
      and(
        eq(tripNotificationPreferences.userId, userId),
        eq(tripNotificationPreferences.tripId, trip.id),
      ),
    )
    .limit(1);
  return { chatMuted: preference?.chatMuted ?? false };
}

export async function setTripNotificationPreferences(
  database: Database,
  userId: string,
  slug: string,
  chatMuted: boolean,
) {
  const trip = await requireTripMember(database, userId, slug);
  await database
    .insert(tripNotificationPreferences)
    .values({ userId, tripId: trip.id, chatMuted })
    .onConflictDoUpdate({
      target: [
        tripNotificationPreferences.userId,
        tripNotificationPreferences.tripId,
      ],
      set: { chatMuted, updatedAt: new Date() },
    });
  return { chatMuted };
}

export async function createJoinNotification(
  database: Database,
  input: { slug: string; actorId: string; status: "pending" | "approved" },
) {
  const [trip] = await database
    .select({ id: trips.id, creatorId: trips.creatorId })
    .from(trips)
    .where(eq(trips.slug, input.slug))
    .limit(1);
  if (!trip) return [];
  const [joinRequest] =
    input.status === "pending"
      ? await database
          .select({ id: tripParticipants.id })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, trip.id),
              eq(tripParticipants.userId, input.actorId),
              eq(tripParticipants.status, "pending"),
            ),
          )
          .limit(1)
      : [];
  const recipients =
    input.status === "pending"
      ? [trip.creatorId]
      : await tripMemberIds(database, trip.id, input.actorId);
  return createNotifications(
    database,
    recipients.map((userId) => ({
      userId,
      actorId: input.actorId,
      tripId: trip.id,
      joinRequestId: joinRequest?.id ?? null,
      type:
        input.status === "pending"
          ? ("join_request" as const)
          : ("participant_joined" as const),
      preview: null,
    })),
  );
}

export async function createJoinReviewNotification(
  database: Database,
  input: { requestId: string; reviewerId: string; accepted: boolean },
) {
  const [request] = await database
    .select({
      userId: tripParticipants.userId,
      tripId: tripParticipants.tripId,
    })
    .from(tripParticipants)
    .where(eq(tripParticipants.id, input.requestId))
    .limit(1);
  if (!request) return [];
  await database
    .update(notifications)
    .set({ joinRequestId: null, readAt: new Date() })
    .where(eq(notifications.joinRequestId, input.requestId));
  await publishNotificationUsers(database, [input.reviewerId]);
  const values: Array<{
    userId: string;
    actorId: string;
    tripId: string;
    type: NotificationType;
    preview: string | null;
    joinRequestId: string | null;
  }> = [
    {
      userId: request.userId,
      actorId: input.reviewerId,
      tripId: request.tripId,
      type: input.accepted ? "join_accepted" : "join_rejected",
      preview: null,
      joinRequestId: null,
    },
  ];
  if (input.accepted) {
    const members = await tripMemberIds(
      database,
      request.tripId,
      request.userId,
    );
    values.push(
      ...members
        .filter((userId) => userId !== input.reviewerId)
        .map((userId) => ({
          userId,
          actorId: request.userId,
          tripId: request.tripId,
          type: "participant_joined" as const,
          preview: null,
          joinRequestId: null,
        })),
    );
  }
  return createNotifications(database, values);
}

export async function createChatNotifications(
  database: Database,
  input: { slug: string; actorId: string; preview: string },
) {
  const [trip] = await database
    .select({ id: trips.id })
    .from(trips)
    .where(eq(trips.slug, input.slug))
    .limit(1);
  if (!trip) return [];
  const recipients = await tripMemberIds(database, trip.id, input.actorId);
  if (!recipients.length) return [];
  const muted = await database
    .select({ userId: tripNotificationPreferences.userId })
    .from(tripNotificationPreferences)
    .where(
      and(
        eq(tripNotificationPreferences.tripId, trip.id),
        eq(tripNotificationPreferences.chatMuted, true),
        inArray(tripNotificationPreferences.userId, recipients),
      ),
    );
  const mutedIds = new Set(muted.map(({ userId }) => userId));
  return createNotifications(
    database,
    recipients
      .filter((userId) => !mutedIds.has(userId))
      .map((userId) => ({
        userId,
        actorId: input.actorId,
        tripId: trip.id,
        type: "chat_message" as const,
        preview: input.preview.slice(0, 180),
        joinRequestId: null,
      })),
  );
}

export async function getPushDeliveries(
  database: Database,
  notificationIds: string[],
) {
  if (!notificationIds.length) return [];
  const actor = alias(users, "push_actor");
  return database
    .select({
      token: pushDevices.expoPushToken,
      locale: pushDevices.locale,
      type: notifications.type,
      tripSlug: trips.slug,
      tripTitle: trips.title,
      actorName: actor.name,
      preview: notifications.preview,
    })
    .from(notifications)
    .innerJoin(pushDevices, eq(pushDevices.userId, notifications.userId))
    .innerJoin(trips, eq(trips.id, notifications.tripId))
    .leftJoin(actor, eq(actor.id, notifications.actorId))
    .where(inArray(notifications.id, notificationIds));
}

export async function subscribeToUserNotifications(
  database: Database,
  userId: string,
  callback: () => void,
) {
  const subscribers = notificationSubscribers.get(userId) ?? new Set();
  subscribers.add(callback);
  notificationSubscribers.set(userId, subscribers);
  if (!notificationListener) {
    notificationListener = database.$client.listen(
      "user_notifications",
      (id) => {
        notificationSubscribers.get(id)?.forEach((subscriber) => subscriber());
      },
    );
    try {
      await notificationListener;
    } catch (error) {
      notificationListener = null;
      subscribers.delete(callback);
      throw error;
    }
  } else {
    await notificationListener;
  }
  return () => {
    const active = notificationSubscribers.get(userId);
    active?.delete(callback);
    if (active?.size === 0) notificationSubscribers.delete(userId);
  };
}

async function createNotifications(
  database: Database,
  values: Array<{
    userId: string;
    actorId: string;
    tripId: string;
    type: NotificationType;
    preview: string | null;
    joinRequestId: string | null;
  }>,
) {
  if (!values.length) return [];
  const created = await database
    .insert(notifications)
    .values(values)
    .returning({ id: notifications.id, userId: notifications.userId });
  await publishNotificationUsers(database, [
    ...new Set(created.map(({ userId }) => userId)),
  ]);
  return created.map(({ id }) => id);
}

async function publishNotificationUsers(database: Database, userIds: string[]) {
  await Promise.all(
    userIds.map((userId) =>
      database.$client.notify("user_notifications", userId),
    ),
  );
}

async function tripMemberIds(
  database: Database,
  tripId: string,
  excludedUserId: string,
) {
  const [trip, participants] = await Promise.all([
    database
      .select({ creatorId: trips.creatorId })
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1),
    database
      .select({ userId: tripParticipants.userId })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.status, "approved"),
          ne(tripParticipants.userId, excludedUserId),
        ),
      ),
  ]);
  return [
    ...new Set([
      ...(trip[0]?.creatorId && trip[0].creatorId !== excludedUserId
        ? [trip[0].creatorId]
        : []),
      ...participants.map(({ userId }) => userId),
    ]),
  ];
}

async function requireTripMember(
  database: Database,
  userId: string,
  slug: string,
) {
  const [trip] = await database
    .select({ id: trips.id, creatorId: trips.creatorId })
    .from(trips)
    .where(eq(trips.slug, slug))
    .limit(1);
  if (!trip) throw new Error("Viaje no encontrado.");
  if (trip.creatorId === userId) return trip;
  const [participant] = await database
    .select({ id: tripParticipants.id })
    .from(tripParticipants)
    .where(
      and(
        eq(tripParticipants.tripId, trip.id),
        eq(tripParticipants.userId, userId),
        eq(tripParticipants.status, "approved"),
      ),
    )
    .limit(1);
  if (!participant) throw new Error("No autorizado.");
  return trip;
}
