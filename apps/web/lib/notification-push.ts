import { getPushDeliveries, type Database } from "@viajeroshub/database";
import {
  isSupportedLocale,
  translate,
  type NotificationType,
  type TranslationKey,
} from "@viajeroshub/shared";

export async function sendNotificationPushes(
  database: Database,
  notificationIds: string[],
) {
  const deliveries = await getPushDeliveries(database, notificationIds);
  if (!deliveries.length) return;
  const messages = deliveries.map((delivery) => {
    const locale = isSupportedLocale(delivery.locale) ? delivery.locale : "es";
    const actor = delivery.actorName ?? translate(locale, "aTraveler");
    return {
      to: delivery.token,
      sound: "default",
      title: translate(locale, notificationTitleKey(delivery.type)),
      body: translate(locale, notificationBodyKey(delivery.type), {
        actor,
        trip: delivery.tripTitle,
        preview: delivery.preview ?? "",
      }),
      data: { tripSlug: delivery.tripSlug },
      threadId: `trip-${delivery.tripSlug}`,
    };
  });
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(messages),
  }).catch(() => undefined);
}

export function notificationTitleKey(type: NotificationType): TranslationKey {
  return type === "chat_message" ? "newChatMessage" : "tripNotification";
}

export function notificationBodyKey(type: NotificationType): TranslationKey {
  const keys: Record<NotificationType, TranslationKey> = {
    join_request: "notificationJoinRequest",
    join_accepted: "notificationJoinAccepted",
    join_rejected: "notificationJoinRejected",
    participant_joined: "notificationParticipantJoined",
    chat_message: "notificationChatMessage",
  };
  return keys[type];
}
