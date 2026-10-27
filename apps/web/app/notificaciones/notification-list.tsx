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
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
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
  async function review(
    notification: AppNotification,
    action: "accept" | "reject",
  ) {
    if (!notification.requestId || busy) return;
    setBusy(notification.id);
    try {
      const response = await fetch(
        `/api/trips/${notification.tripSlug}/requests/${notification.requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) throw new Error("Error");
      setHandled((current) => new Set(current).add(notification.id));
      markRead(notification.id);
    } finally {
      setBusy(null);
    }
  }
  if (!notifications.length)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="font-semibold text-slate-600">{t("noNotifications")}</p>
      </div>
    );
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
        {notifications.map((notification) => {
          const href =
            notification.type === "chat_message"
              ? `/mensajes/${notification.tripSlug}`
              : `/viajes/${notification.tripSlug}`;
          return (
            <article
              key={notification.id}
              className={`flex gap-4 border-b border-slate-100 p-5 last:border-0 ${notification.isRead ? "bg-white" : "bg-blue-50/70"}`}
            >
              {notification.actorUsername ? (
                <Link
                  href={`/viajeros/${notification.actorUsername}`}
                  aria-label={
                    notification.actorName ?? notification.actorUsername
                  }
                >
                  <UserAvatar
                    image={notification.actorImage}
                    name={notification.actorName}
                    username={notification.actorUsername}
                    size="sm"
                  />
                </Link>
              ) : (
                <UserAvatar
                  image={notification.actorImage}
                  name={notification.actorName}
                  username={null}
                  size="sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={href}
                  onClick={() => markRead(notification.id)}
                  className="block rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                >
                  <p className="font-bold text-slate-950">
                    {notificationText(notification, t)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(notification.createdAt))}
                  </p>
                </Link>
                {notification.type === "join_request" &&
                notification.requestId &&
                !handled.has(notification.id) ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={busy === notification.id}
                      onClick={() => void review(notification, "accept")}
                      className="min-h-11 rounded-xl bg-[#0B6EFD] px-5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {t("accept")}
                    </button>
                    <button
                      disabled={busy === notification.id}
                      onClick={() => void review(notification, "reject")}
                      className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 disabled:opacity-50"
                    >
                      {t("reject")}
                    </button>
                  </div>
                ) : null}
              </div>
              {!notification.isRead ? (
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#0B6EFD]" />
              ) : null}
            </article>
          );
        })}
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
