"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationBell({
  initialUnreadCount,
  label,
}: {
  initialUnreadCount: number;
  label: string;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const refresh = () => {
      fetch("/api/notifications", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { unreadCount?: unknown } | null) => {
          if (typeof payload?.unreadCount === "number")
            setUnreadCount(payload.unreadCount);
        })
        .catch(() => undefined);
    };
    const events = new EventSource("/api/notifications/stream");
    events.addEventListener("notifications", refresh);
    return () => {
      events.removeEventListener("notifications", refresh);
      events.close();
    };
  }, []);

  return (
    <Link
      href="/notificaciones"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-[#0B6EFD]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
      >
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {unreadCount ? (
        <span className="absolute top-1 right-0 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] leading-5 font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
