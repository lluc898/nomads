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
  const bottomRef = useRef<HTMLDivElement>(null);

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
    void loadMessages();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages(true);
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <article className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-extrabold text-slate-950">{t("chat")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("chatSubtitle")}</p>

      <div
        aria-live="polite"
        className="mt-5 h-96 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4"
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
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
      ) : null}
      <form onSubmit={submit} className="mt-4 flex gap-2">
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
          className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#0B6EFD] focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="self-stretch rounded-xl bg-[#0B6EFD] px-5 font-bold text-white disabled:opacity-50"
        >
          {sending ? t("sending") : t("send")}
        </button>
      </form>
    </article>
  );
}
