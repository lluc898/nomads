import type { AppNotification, TranslationKey } from "@viajeroshub/shared";

export function notificationText(
  notification: AppNotification,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
) {
  const keys: Record<AppNotification["type"], TranslationKey> = {
    join_request: "notificationJoinRequest",
    join_accepted: "notificationJoinAccepted",
    join_rejected: "notificationJoinRejected",
    participant_joined: "notificationParticipantJoined",
    chat_message: "notificationChatMessage",
  };
  return t(keys[notification.type], {
    actor: notification.actorName ?? t("aTraveler"),
    trip: notification.tripTitle,
    preview: notification.preview ?? "",
  });
}
