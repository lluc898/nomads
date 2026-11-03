"use client";

import {
  translate,
  type SupportedLocale,
  type TripDetail,
} from "@viajeroshub/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { UserAvatar } from "@/components/user-avatar";

export function TripMembership({
  slug,
  visibility,
  tripStatus,
  status,
  isFull,
  pendingRequests,
  locale,
}: {
  slug: string;
  visibility: TripDetail["visibility"];
  tripStatus: TripDetail["status"];
  status: TripDetail["viewerMembershipStatus"];
  isFull: boolean;
  pendingRequests: TripDetail["pendingRequests"];
  locale: SupportedLocale;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  async function join() {
    setBusy("join");
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${slug}/join`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        status?: "pending" | "approved";
      } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Error");
      setMessage(
        payload?.status === "pending" ? t("requestSent") : t("joinedSuccess"),
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function review(requestId: string, action: "accept" | "reject") {
    setBusy(requestId);
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${slug}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Error");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function archiveTrip() {
    if (!window.confirm(t("closeTripConfirm"))) return;
    setBusy("close");
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${slug}/archive`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Error");
      setMessage(t("closeTripSuccess"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function leaveTrip() {
    if (!window.confirm(t("leaveTripConfirm"))) return;
    setBusy("leave");
    setMessage(null);
    try {
      const response = await fetch(`/api/trips/${slug}/leave`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Error");
      setMessage(t("leaveTripSuccess"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {tripStatus === "archived" ? (
        <div className="rounded-xl bg-slate-100 p-4">
          <p className="font-extrabold text-slate-900">{t("tripClosed")}</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {t("closedTripHelp")}
          </p>
          {status === "approved" ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={leaveTrip}
              className="mt-4 text-sm font-bold text-red-700 disabled:opacity-50"
            >
              {t("leaveTrip")}
            </button>
          ) : null}
        </div>
      ) : status === "owner" ? (
        <div>
          <p className="font-bold text-slate-900">{t("alreadyMember")}</p>
          {pendingRequests.length ? (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h2 className="font-extrabold text-slate-950">
                {t("joinRequests")} ({pendingRequests.length})
              </h2>
              <div className="mt-3 space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-slate-50 p-3">
                    {request.username ? (
                      <Link
                        href={`/viajeros/${request.username}`}
                        className="flex items-center gap-3 rounded-lg transition hover:text-[#0B6EFD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6EFD]"
                      >
                        <UserAvatar
                          image={request.image}
                          name={request.name}
                          username={request.username}
                          size="sm"
                        />
                        <span>
                          <span className="block font-bold text-slate-900">
                            {request.name ?? `@${request.username}`}
                          </span>
                          <span className="block text-sm text-slate-500">
                            @{request.username}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <p className="font-bold text-slate-900">{request.name}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy !== null || isFull}
                        onClick={() => review(request.id, "accept")}
                        className="rounded-lg bg-[#0B6EFD] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {t("accept")}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => review(request.id, "reject")}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
                      >
                        {t("reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            disabled={busy !== null}
            onClick={archiveTrip}
            className="mt-5 w-full rounded-xl border border-red-200 px-4 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {t("closeTrip")}
          </button>
        </div>
      ) : status === "approved" ? (
        <div>
          <p className="font-bold text-green-700">{t("alreadyMember")}</p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={leaveTrip}
            className="mt-4 text-sm font-bold text-red-700 disabled:opacity-50"
          >
            {t("leaveTrip")}
          </button>
        </div>
      ) : status === "pending" ? (
        <p className="font-bold text-amber-700">{t("requestPending")}</p>
      ) : isFull ? (
        <p className="font-bold text-red-700">{t("tripFull")}</p>
      ) : (
        <button
          type="button"
          disabled={busy !== null}
          onClick={join}
          className="w-full rounded-xl bg-[#0B6EFD] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {visibility === "private" ? t("requestToJoin") : t("joinTrip")}
        </button>
      )}
      {message ? (
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      ) : null}
    </div>
  );
}
