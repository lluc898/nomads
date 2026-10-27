"use client";

import type { ChatMessage, SupportedLocale } from "@viajeroshub/shared";
import { CHAT_MESSAGE_MAX_LENGTH, translate } from "@viajeroshub/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/user-avatar";

export function TripChat({
  slug,
  locale,
}: {
  slug: string;
  locale: SupportedLocale;
}) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMuted, setChatMuted] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const response = await fetch(`/api/trips/${slug}/messages`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as {
          messages?: ChatMessage[];
          message?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.message ?? "Error");
        setMessages(payload?.messages ?? []);
        setError(null);
      } catch (caught) {
        if (!quiet)
          setError(caught instanceof Error ? caught.message : "Error");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    let active = true;
    fetch(`/api/trips/${slug}/messages`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          messages?: ChatMessage[];
          message?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.message ?? "Error");
        return payload?.messages ?? [];
      })
      .then((nextMessages) => {
        if (!active) return;
        setMessages(nextMessages);
        setError(null);
      })
      .catch((caught) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "Error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const events = new EventSource(`/api/trips/${slug}/messages/stream`);
    const refresh = () => void loadMessages(true);
    events.addEventListener("messages", refresh);
    return () => {
      active = false;
      events.removeEventListener("messages", refresh);
      events.close();
    };
  }, [loadMessages, slug]);

  useEffect(() => {
    fetch(`/api/trips/${slug}/notification-preferences`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((preference: { chatMuted?: unknown } | null) => {
        if (typeof preference?.chatMuted === "boolean")
          setChatMuted(preference.chatMuted);
      })
      .catch(() => undefined);
  }, [slug]);

  async function toggleChatNotifications() {
    if (savingPreference) return;
    const nextMuted = !chatMuted;
    setSavingPreference(true);
    setChatMuted(nextMuted);
    try {
      const response = await fetch(
        `/api/trips/${slug}/notification-preferences`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatMuted: nextMuted }),
        },
      );
      if (!response.ok) throw new Error("Error");
    } catch {
      setChatMuted(!nextMuted);
    } finally {
      setSavingPreference(false);
    }
  }

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextContent = content.trim();
    if (!nextContent || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${slug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });
      const payload = (await response.json().catch(() => null)) as
        ChatMessage | { message?: string } | null;
      if (!response.ok) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Error",
        );
      }
      setMessages((current) => [...current, payload as ChatMessage]);
      setContent("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="px-5 pb-12">
      <div className="mx-auto flex h-[min(44rem,80vh)] max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">
              {t("chat")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t("chatSubtitle")}</p>
          </div>
          <button
            type="button"
            disabled={savingPreference}
            onClick={toggleChatNotifications}
            aria-label={
              chatMuted
                ? t("unmuteChatNotifications")
                : t("muteChatNotifications")
            }
            title={
              chatMuted
                ? t("unmuteChatNotifications")
                : t("muteChatNotifications")
            }
            className="grid size-11 place-items-center rounded-full bg-slate-100 text-lg transition hover:bg-blue-50 disabled:opacity-50"
          >
            {chatMuted ? "🔕" : "🔔"}
          </button>
        </div>

        <div
          ref={messagesRef}
          aria-live="polite"
          className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4"
        >
          {loading ? (
            <p className="text-center text-sm text-slate-500">…</p>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
              >
                <UserAvatar
                  image={message.author.image}
                  name={message.author.name}
                  username={message.author.username}
                  size="sm"
                />
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    message.isOwn
                      ? "rounded-tr-sm bg-[#0B6EFD] text-white"
                      : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {!message.isOwn ? (
                    <p className="mb-1 text-xs font-bold text-[#0857C9]">
                      {message.author.name ?? `@${message.author.username}`}
                    </p>
                  ) : null}
                  <p className="break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-right text-[11px] ${message.isOwn ? "text-blue-100" : "text-slate-400"}`}
                  >
                    {new Intl.DateTimeFormat(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(message.createdAt))}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-sm text-center text-sm text-slate-500">
                {t("noMessages")}
              </p>
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
        ) : null}
        <form onSubmit={submit} className="mt-4 flex items-end gap-3">
          <label className="sr-only" htmlFor="trip-chat-message">
            {t("messagePlaceholder")}
          </label>
          <textarea
            id="trip-chat-message"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            rows={2}
            placeholder={t("messagePlaceholder")}
            className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#0B6EFD] focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            aria-label={t("send")}
            title={sending ? t("sending") : t("send")}
            disabled={!content.trim() || sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B6EFD] text-white disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M3.4 2.7 21 11.1a1 1 0 0 1 0 1.8L3.4 21.3a1 1 0 0 1-1.4-1.1l1.4-6.5 9-1.7-9-1.7L2 3.8a1 1 0 0 1 1.4-1.1Z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
