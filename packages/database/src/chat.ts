import type { ChatMessage, TripConversationSummary } from "@viajeroshub/shared";
import { and, count, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import type { Database } from "./client";
import {
  conversations,
  messages,
  notifications,
  tripParticipants,
  trips,
  users,
} from "./schema";

export class TripChatNotFoundError extends Error {}
export class TripChatAccessError extends Error {}
export class TripChatRateLimitError extends Error {}

const MAX_MESSAGES_PER_MINUTE = 20;
const chatSubscribers = new Map<string, Set<() => void>>();
let chatListener: ReturnType<Database["$client"]["listen"]> | null = null;

export async function listUserTripConversations(
  database: Database,
  userId: string,
): Promise<TripConversationSummary[]> {
  const rows = await database.execute<{
    tripSlug: string;
    tripTitle: string;
    lastMessage: string | null;
    lastMessageAt: Date | string | null;
    lastSenderName: string | null;
    unreadCount: number | string;
  }>(sql`
    select
      t.slug as "tripSlug",
      t.title as "tripTitle",
      latest.content as "lastMessage",
      latest.created_at as "lastMessageAt",
      sender.display_name as "lastSenderName",
      (
        select count(*)
        from notifications n
        where n.user_id = ${userId}
          and n.trip_id = t.id
          and n.type = 'chat_message'
          and n.read_at is null
      ) as "unreadCount"
    from trips t
    left join conversations c on c.trip_id = t.id
    left join lateral (
      select m.content, m.created_at, m.sender_id
      from messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ) latest on true
    left join users sender on sender.id = latest.sender_id
    where t.status in ('published', 'archived')
      and (
        t.creator_id = ${userId}
        or exists (
          select 1
          from trip_participants tp
          where tp.trip_id = t.id
            and tp.user_id = ${userId}
            and tp.status in ('approved', 'expired', 'left')
        )
      )
    order by coalesce(latest.created_at, t.created_at) desc
  `);
  return rows.map((row) => ({
    tripSlug: row.tripSlug,
    tripTitle: row.tripTitle,
    lastMessage: row.lastMessage,
    lastMessageAt: row.lastMessageAt
      ? new Date(row.lastMessageAt).toISOString()
      : null,
    lastSenderName: row.lastSenderName,
    unreadCount: Number(row.unreadCount),
  }));
}

export async function markTripChatNotificationsRead(
  database: Database,
  slug: string,
  userId: string,
) {
  const trip = await requireTripChatAccess(database, slug, userId);
  const updated = await database
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.tripId, trip.id),
        eq(notifications.type, "chat_message"),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });
  if (updated.length)
    await database.$client.notify("user_notifications", userId);
}

export async function listTripMessages(
  database: Database,
  slug: string,
  userId: string,
): Promise<ChatMessage[]> {
  const trip = await requireTripChatAccess(database, slug, userId);
  const [conversation] = await database
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.tripId, trip.id))
    .limit(1);
  if (!conversation) return [];

  const rows = await database
    .select({
      id: messages.id,
      content: messages.content,
      kind: messages.kind,
      createdAt: messages.createdAt,
      senderId: users.id,
      senderName: users.name,
      senderUsername: users.username,
      senderImage: users.image,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(desc(messages.createdAt))
    .limit(100);

  return rows.reverse().map((row) => toChatMessage(row, userId));
}

export async function sendTripMessage(
  database: Database,
  input: { slug: string; userId: string; content: string },
): Promise<ChatMessage> {
  const created = await database.transaction(async (transaction) => {
    const trip = await requireTripChatAccess(
      transaction,
      input.slug,
      input.userId,
      true,
    );
    let [conversation] = await transaction
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.tripId, trip.id))
      .limit(1);
    if (!conversation) {
      [conversation] = await transaction
        .insert(conversations)
        .values({ tripId: trip.id })
        .onConflictDoNothing({ target: conversations.tripId })
        .returning({ id: conversations.id });
      if (!conversation) {
        [conversation] = await transaction
          .select({ id: conversations.id })
          .from(conversations)
          .where(eq(conversations.tripId, trip.id))
          .limit(1);
      }
    }
    if (!conversation) throw new TripChatNotFoundError("Chat no encontrado.");

    const since = new Date(Date.now() - 60_000);
    const [recent] = await transaction
      .select({ value: count() })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, input.userId),
          gte(messages.createdAt, since),
        ),
      );
    if (Number(recent?.value ?? 0) >= MAX_MESSAGES_PER_MINUTE) {
      throw new TripChatRateLimitError(
        "Has enviado demasiados mensajes. Espera un momento.",
      );
    }

    const [created] = await transaction
      .insert(messages)
      .values({
        conversationId: conversation.id,
        senderId: input.userId,
        content: input.content,
      })
      .returning({
        id: messages.id,
        content: messages.content,
        kind: messages.kind,
        createdAt: messages.createdAt,
      });
    const [author] = await transaction
      .select({
        senderId: users.id,
        senderName: users.name,
        senderUsername: users.username,
        senderImage: users.image,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!created || !author)
      throw new TripChatNotFoundError("No se pudo enviar el mensaje.");
    return {
      conversationId: conversation.id,
      message: toChatMessage({ ...created, ...author }, input.userId),
    };
  });
  await database.$client.notify("trip_chat", created.conversationId);
  return created.message;
}

export async function getTripConversationId(
  database: Database,
  slug: string,
  userId: string,
) {
  const trip = await requireTripChatAccess(database, slug, userId);
  const [conversation] = await database
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.tripId, trip.id))
    .limit(1);
  if (!conversation) throw new TripChatNotFoundError("Chat no encontrado.");
  return conversation.id;
}

export async function subscribeToTripMessages(
  database: Database,
  conversationId: string,
  callback: () => void,
) {
  const subscribers = chatSubscribers.get(conversationId) ?? new Set();
  subscribers.add(callback);
  chatSubscribers.set(conversationId, subscribers);

  if (!chatListener) {
    chatListener = database.$client.listen("trip_chat", (payload) => {
      chatSubscribers.get(payload)?.forEach((subscriber) => subscriber());
    });
    try {
      await chatListener;
    } catch (error) {
      chatListener = null;
      subscribers.delete(callback);
      throw error;
    }
  } else {
    await chatListener;
  }

  return () => {
    const active = chatSubscribers.get(conversationId);
    active?.delete(callback);
    if (active?.size === 0) chatSubscribers.delete(conversationId);
  };
}

async function requireTripChatAccess(
  database: Pick<Database, "select">,
  slug: string,
  userId: string,
  write = false,
) {
  const [trip] = await database
    .select({ id: trips.id, creatorId: trips.creatorId, status: trips.status })
    .from(trips)
    .where(
      and(
        eq(trips.slug, slug),
        inArray(trips.status, ["published", "archived"]),
      ),
    )
    .limit(1);
  if (!trip) throw new TripChatNotFoundError("Viaje no encontrado.");
  if (trip.creatorId === userId) {
    if (write && trip.status !== "published") {
      throw new TripChatAccessError("Este chat estÃ¡ disponible solo para consulta.");
    }
    return trip;
  }
  const [participant] = await database
    .select({ id: tripParticipants.id, status: tripParticipants.status })
    .from(tripParticipants)
    .where(
      and(
        eq(tripParticipants.tripId, trip.id),
        eq(tripParticipants.userId, userId),
        inArray(tripParticipants.status, ["approved", "expired", "left"]),
      ),
    )
    .limit(1);
  if (!participant) {
    throw new TripChatAccessError(
      "El chat solo está disponible para integrantes del viaje.",
    );
  }
  if (
    write &&
    (trip.status !== "published" || participant.status !== "approved")
  ) {
    throw new TripChatAccessError("Este chat estÃ¡ disponible solo para consulta.");
  }
  return trip;
}

function toChatMessage(
  row: {
    id: string;
    content: string;
    kind: "message" | "system";
    createdAt: Date;
    senderId: string;
    senderName: string | null;
    senderUsername: string | null;
    senderImage: string | null;
  },
  viewerUserId: string,
): ChatMessage {
  return {
    id: row.id,
    content: row.content,
    kind: row.kind,
    createdAt: row.createdAt.toISOString(),
    isOwn: row.senderId === viewerUserId,
    author: {
      userId: row.senderId,
      name: row.senderName,
      username: row.senderUsername,
      image: row.senderImage,
    },
  };
}
