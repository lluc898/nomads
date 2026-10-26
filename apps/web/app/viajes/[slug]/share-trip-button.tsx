"use client";

import { useState } from "react";

import { ShareIcon } from "@/components/icons";

export function ShareTripButton({
  slug,
  title,
  label,
  copiedLabel,
}: {
  slug: string;
  title: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/viajes/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={label}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 text-sm font-bold text-[#0857C9] shadow-sm transition hover:border-[#0B6EFD] hover:bg-blue-50"
    >
      <ShareIcon className="size-5" />
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
