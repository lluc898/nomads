"use client";

import {
  translate,
  type AppNotification,
  type SupportedLocale,
  type TranslationKey,
} from "@viajeroshub/shared";
import Link from "next/link";
import { useState } from "react";

import { UserAvatar } from "@/components/user-avatar";

export function NotificationList({
  initialNotifications,
  locale,
}: {
  initialNotifications: AppNotification[];
  locale: SupportedLocale;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const t = (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);
  const unread = notifications.some((notification) => !notification.isRead);

  function markRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
      keepalive: true,
    });
  }

  function markAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  if (!notifications.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
          🔔
        </div>
        <p className="mt-4 font-semibold text-slate-600">
          {t("noNotifications")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          disabled={!unread}
          onClick={markAllRead}
          className="min-h-11 rounded-xl px-4 text-sm font-bold text-[#0857C9] hover:bg-blue-50 disabled:opacity-40"
        >
          {t("markAllRead")}
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={`/viajes/${notification.tripSlug}`}
            onClick={() => markRead(notification.id)}
            className={`flex gap-4 border-b border-slate-100 p-5 transition last:border-0 hover:bg-slate-50 ${
              notification.isRead ? "bg-white" : "bg-blue-50/70"
            }`}
          >
            <UserAvatar
              image={notification.actorImage}
              name={notification.actorName}
              username={null}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-950">
                {notificationText(notification, t)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(notification.createdAt))}
              </p>
            </div>
            {!notification.isRead ? (
              <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#0B6EFD]" />
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function notificationText(
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
